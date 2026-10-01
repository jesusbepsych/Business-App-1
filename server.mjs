import http from 'node:http';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
try {
  const localEnvironment = await readFile(path.join(root,'.env'),'utf8');
  for (const line of localEnvironment.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[2].startsWith('#') || process.env[match[1]] != null) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/,'$2');
  }
} catch (error) {
  if (error.code !== 'ENOENT') console.warn('Could not load local .env file.',error);
}
const port = Number(process.env.PORT || 3000);
const appOrigin = String(process.env.APP_ORIGIN || `http://localhost:${port}`).replace(/\/$/, '');
const clientId = process.env.GOOGLE_CLIENT_ID || '';
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appOrigin}/oauth/google/callback`;
const rawEncryptionKey = process.env.CALENDAR_ENCRYPTION_KEY || '';
const configured = Boolean(clientId && clientSecret && rawEncryptionKey && appOrigin);
const secureCookies = appOrigin.startsWith('https://');
const dataDirectory = path.resolve(process.env.CALENDAR_DATA_DIR || path.join(root, '.data'));
const storePath = path.join(dataDirectory, 'calendar-connections.json');
const encryptionKey = rawEncryptionKey ? createHash('sha256').update(rawEncryptionKey).digest() : null;
const accessTokenCache = new Map();

const calendarScopes = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
];

function seal(value) {
  if (!encryptionKey) throw new Error('Calendar encryption is not configured.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function unseal(value) {
  if (!encryptionKey || !value) return null;
  try {
    const payload = Buffer.from(value, 'base64url');
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
  } catch {
    return null;
  }
}

async function readStore() {
  try {
    const parsed = JSON.parse(await readFile(storePath, 'utf8'));
    if (parsed?.version === 1 && parsed.connections && typeof parsed.connections === 'object') return parsed;
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Could not read calendar store.', error);
  }
  return { version:1, connections:{} };
}

async function saveStore(store) {
  await mkdir(dataDirectory, { recursive:true, mode:0o700 });
  const temporary = `${storePath}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(store, null, 2), { mode:0o600 });
  await rename(temporary, storePath);
}

function parseCookies(request) {
  return Object.fromEntries(String(request.headers.cookie || '').split(';').map(value => value.trim()).filter(Boolean).map(value => {
    const index = value.indexOf('=');
    return index < 0 ? [value, ''] : [value.slice(0,index), decodeURIComponent(value.slice(index + 1))];
  }));
}

function cookie(name, value, { maxAge = 60 * 60 * 24 * 30 } = {}) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureCookies ? '; Secure' : ''}`;
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureCookies ? '; Secure' : ''}`;
}

function sessionFrom(request) {
  const session = unseal(parseCookies(request).bl_calendar_session);
  return session?.sub && Number(session.exp || 0) > Date.now() ? session : null;
}

function json(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function redirect(response, location, headers = {}) {
  response.writeHead(302, { Location:location, 'Cache-Control':'no-store', ...headers });
  response.end();
}

async function bodyJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 64 * 1024) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function requireSameOrigin(request, response) {
  const origin = request.headers.origin;
  if (origin && origin !== appOrigin) {
    json(response, 403, { error:'Cross-origin request rejected.' });
    return false;
  }
  return true;
}

function localReturnPath(value) {
  const candidate = String(value || '/');
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '/';
}

async function tokenRequest(parameters) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded', Accept:'application/json' },
    body:new URLSearchParams(parameters),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_description || payload.error || 'Google token exchange failed.');
  return payload;
}

async function accessTokenFor(connection) {
  const cached = accessTokenCache.get(connection.sub);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const refreshToken = unseal(connection.refreshToken)?.token;
  if (!refreshToken) throw new Error('Google Calendar needs to be reconnected.');
  const payload = await tokenRequest({
    client_id:clientId,
    client_secret:clientSecret,
    refresh_token:refreshToken,
    grant_type:'refresh_token',
  });
  accessTokenCache.set(connection.sub, { token:payload.access_token, expiresAt:Date.now() + Number(payload.expires_in || 3600) * 1000 });
  return payload.access_token;
}

async function googleJson(url, accessToken, options = {}) {
  const response = await fetch(url, { ...options, headers:{ Authorization:`Bearer ${accessToken}`, Accept:'application/json', ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || payload.error_description || 'Google Calendar request failed.');
  return payload;
}

async function connectionFor(request) {
  const session = sessionFrom(request);
  if (!session) return { session:null, store:null, connection:null };
  const store = await readStore();
  return { session, store, connection:store.connections[session.sub] || null };
}

async function listCalendars(connection) {
  const token = await accessTokenFor(connection);
  const calendars = [];
  let pageToken = '';
  do {
    const url = new URL('https://www.googleapis.com/calendar/v3/users/me/calendarList');
    url.searchParams.set('maxResults','250');
    url.searchParams.set('showHidden','false');
    if (pageToken) url.searchParams.set('pageToken',pageToken);
    const payload = await googleJson(url, token);
    calendars.push(...(payload.items || []).filter(item => !item.deleted && !item.hidden).map(item => ({
      id:item.id,
      name:item.summaryOverride || item.summary || 'Calendar',
      primary:Boolean(item.primary),
      accessRole:item.accessRole || '',
      color:item.backgroundColor || '#8ed8f7',
    })));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);
  return calendars;
}

async function eventsForCalendar(connection, calendar, { start, end }) {
  const token = await accessTokenFor(connection);
  const events = [];
  let pageToken = '';
  do {
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`);
    url.searchParams.set('timeMin', `${start}T00:00:00Z`);
    url.searchParams.set('timeMax', `${end}T23:59:59Z`);
    url.searchParams.set('singleEvents','true');
    url.searchParams.set('orderBy','startTime');
    url.searchParams.set('showDeleted','true');
    url.searchParams.set('maxResults','2500');
    url.searchParams.append('eventTypes','default');
    if (pageToken) url.searchParams.set('pageToken',pageToken);
    const payload = await googleJson(url, token);
    events.push(...(payload.items || []).map(event => ({
      id:`${calendar.id}:${event.id}`,
      googleEventId:event.id,
      calendarId:calendar.id,
      calendarName:calendar.name,
      color:calendar.color,
      title:event.summary || 'Untitled event',
      location:event.location || '',
      status:event.status || 'confirmed',
      allDay:Boolean(event.start?.date),
      startDate:event.start?.date || '',
      endDate:event.end?.date || '',
      startDateTime:event.start?.dateTime || '',
      endDateTime:event.end?.dateTime || '',
      recurringEventId:event.recurringEventId || '',
      updated:event.updated || '',
    })));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);
  return events;
}

async function handleApi(request, response, url) {
  if (url.pathname === '/api/health') return json(response, 200, { ok:true, calendarConfigured:configured });

  if (url.pathname === '/api/google-calendar/status' && request.method === 'GET') {
    if (!configured) return json(response, 200, { configured:false, connected:false });
    const { connection } = await connectionFor(request);
    return json(response, 200, {
      configured:true,
      connected:Boolean(connection),
      account:connection ? { email:connection.email, name:connection.name, picture:connection.picture } : null,
      lastSyncedAt:connection?.lastSyncedAt || '',
    });
  }

  if (url.pathname === '/api/google-calendar/connect' && request.method === 'GET') {
    if (!configured) return json(response, 503, { error:'Google Calendar OAuth is not configured on this server.' });
    const state = randomBytes(32).toString('base64url');
    const currentSession = sessionFrom(request);
    const statePayload = seal({ state, priorSub:currentSession?.sub || '', returnTo:localReturnPath(url.searchParams.get('returnTo')), exp:Date.now() + 10 * 60_000 });
    const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorization.searchParams.set('client_id',clientId);
    authorization.searchParams.set('redirect_uri',redirectUri);
    authorization.searchParams.set('response_type','code');
    authorization.searchParams.set('scope',calendarScopes.join(' '));
    authorization.searchParams.set('access_type','offline');
    authorization.searchParams.set('include_granted_scopes','true');
    authorization.searchParams.set('state',state);
    authorization.searchParams.set('prompt',url.searchParams.get('chooseAccount') === '1' ? 'consent select_account' : 'consent');
    return redirect(response, authorization.toString(), { 'Set-Cookie':cookie('bl_calendar_oauth',statePayload,{ maxAge:600 }) });
  }

  if (url.pathname === '/oauth/google/callback' && request.method === 'GET') {
    if (!configured) return redirect(response, '/?calendar=not-configured');
    const oauthState = unseal(parseCookies(request).bl_calendar_oauth);
    const returnedState = String(url.searchParams.get('state') || '');
    const expected = String(oauthState?.state || '');
    const validState = expected.length === returnedState.length && expected && timingSafeEqual(Buffer.from(expected),Buffer.from(returnedState));
    if (!validState || Number(oauthState.exp || 0) < Date.now()) return redirect(response, '/?calendar=invalid-state', { 'Set-Cookie':clearCookie('bl_calendar_oauth') });
    if (url.searchParams.get('error')) return redirect(response, `${oauthState.returnTo || '/'}${String(oauthState.returnTo || '').includes('?') ? '&' : '?'}calendar=denied`, { 'Set-Cookie':clearCookie('bl_calendar_oauth') });
    try {
      const tokens = await tokenRequest({
        code:String(url.searchParams.get('code') || ''),
        client_id:clientId,
        client_secret:clientSecret,
        redirect_uri:redirectUri,
        grant_type:'authorization_code',
      });
      const user = await googleJson('https://openidconnect.googleapis.com/v1/userinfo', tokens.access_token);
      if (!user.sub || !user.email) throw new Error('Google account identity was unavailable.');
      const store = await readStore();
      const existing = store.connections[user.sub] || {};
      const refreshToken = tokens.refresh_token ? seal({ token:tokens.refresh_token }) : existing.refreshToken;
      if (!refreshToken) throw new Error('Google did not provide offline access. Reconnect and approve access again.');
      store.connections[user.sub] = {
        ...existing,
        sub:user.sub,
        email:user.email,
        name:user.name || user.email,
        picture:user.picture || '',
        refreshToken,
        selectedCalendarIds:Array.isArray(existing.selectedCalendarIds) ? existing.selectedCalendarIds : [],
        connectedAt:existing.connectedAt || new Date().toISOString(),
        updatedAt:new Date().toISOString(),
      };
      if (oauthState.priorSub && oauthState.priorSub !== user.sub && store.connections[oauthState.priorSub]) {
        const priorToken = unseal(store.connections[oauthState.priorSub].refreshToken)?.token;
        if (priorToken) fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(priorToken)}`, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' } }).catch(() => {});
        delete store.connections[oauthState.priorSub];
        accessTokenCache.delete(oauthState.priorSub);
      }
      await saveStore(store);
      accessTokenCache.set(user.sub,{ token:tokens.access_token, expiresAt:Date.now() + Number(tokens.expires_in || 3600) * 1000 });
      const session = seal({ sub:user.sub, email:user.email, exp:Date.now() + 30 * 24 * 60 * 60_000 });
      return redirect(response, oauthState.returnTo || '/?calendar=connected', { 'Set-Cookie':[cookie('bl_calendar_session',session),clearCookie('bl_calendar_oauth')] });
    } catch (error) {
      console.error('Google OAuth callback failed.', error);
      return redirect(response, '/?calendar=failed', { 'Set-Cookie':clearCookie('bl_calendar_oauth') });
    }
  }

  if (url.pathname === '/api/google-calendar/calendars' && request.method === 'GET') {
    const { connection, store } = await connectionFor(request);
    if (!connection) return json(response, 401, { error:'Connect Google Calendar first.' });
    const calendars = await listCalendars(connection);
    if (!connection.selectedCalendarIds?.length) {
      const primary = calendars.find(calendar => calendar.primary) || calendars[0];
      connection.selectedCalendarIds = primary ? [primary.id] : [];
      connection.updatedAt = new Date().toISOString();
      await saveStore(store);
    }
    return json(response, 200, { calendars, selectedCalendarIds:connection.selectedCalendarIds || [] });
  }

  if (url.pathname === '/api/google-calendar/calendars' && request.method === 'POST') {
    if (!requireSameOrigin(request,response)) return;
    const { connection, store } = await connectionFor(request);
    if (!connection) return json(response, 401, { error:'Connect Google Calendar first.' });
    const body = await bodyJson(request);
    const requested = Array.isArray(body.selectedCalendarIds) ? [...new Set(body.selectedCalendarIds.map(String))].slice(0,25) : [];
    const available = new Set((await listCalendars(connection)).map(calendar => calendar.id));
    connection.selectedCalendarIds = requested.filter(id => available.has(id));
    connection.updatedAt = new Date().toISOString();
    await saveStore(store);
    return json(response, 200, { selectedCalendarIds:connection.selectedCalendarIds });
  }

  if (url.pathname === '/api/google-calendar/events' && request.method === 'GET') {
    const { connection, store } = await connectionFor(request);
    if (!connection) return json(response, 401, { error:'Connect Google Calendar first.' });
    const start = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('start') || '') ? url.searchParams.get('start') : new Date().toISOString().slice(0,10);
    const end = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('end') || '') ? url.searchParams.get('end') : new Date(Date.now() + 22 * 864e5).toISOString().slice(0,10);
    const calendars = await listCalendars(connection);
    const selected = new Set(connection.selectedCalendarIds || []);
    const activeCalendars = calendars.filter(calendar => selected.has(calendar.id)).slice(0,25);
    const results = await Promise.all(activeCalendars.map(calendar => eventsForCalendar(connection,calendar,{ start,end })));
    connection.lastSyncedAt = new Date().toISOString();
    connection.updatedAt = connection.lastSyncedAt;
    await saveStore(store);
    return json(response, 200, { events:results.flat(), syncedAt:connection.lastSyncedAt });
  }

  if (url.pathname === '/api/google-calendar/disconnect' && request.method === 'POST') {
    if (!requireSameOrigin(request,response)) return;
    const { session, connection, store } = await connectionFor(request);
    if (connection) {
      const token = unseal(connection.refreshToken)?.token;
      if (token) fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' } }).catch(() => {});
      delete store.connections[session.sub];
      await saveStore(store);
      accessTokenCache.delete(session.sub);
    }
    return json(response, 200, { disconnected:true }, { 'Set-Cookie':clearCookie('bl_calendar_session') });
  }

  return json(response, 404, { error:'API route not found.' });
}

const mimeTypes = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon',
};

async function serveStatic(response, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const decoded = decodeURIComponent(requested);
  const filePath = path.resolve(root, `.${decoded}`);
  if (!filePath.startsWith(`${root}${path.sep}`) || filePath.includes(`${path.sep}.data${path.sep}`) || filePath.endsWith(`${path.sep}.env`)) return json(response,403,{ error:'Forbidden.' });
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw Object.assign(new Error('Not a file'),{ code:'ENOENT' });
    const content = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type':mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control':path.extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'strict-origin-when-cross-origin',
      'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') return json(response,404,{ error:'File not found.' });
    throw error;
  }
}

const server = http.createServer(async (request,response) => {
  try {
    const url = new URL(request.url || '/', appOrigin);
    if (url.pathname.startsWith('/api/') || url.pathname === '/oauth/google/callback') await handleApi(request,response,url);
    else await serveStatic(response,url.pathname);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) json(response,500,{ error:'The server could not complete that request.' });
    else response.end();
  }
});

server.listen(port, () => {
  console.log(`Business Ledger listening at ${appOrigin}`);
  console.log(configured ? `Google Calendar callback: ${redirectUri}` : 'Google Calendar is disabled until OAuth environment variables are set.');
});
