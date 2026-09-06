(() => {
  'use strict';

  const STORAGE_KEY = 'business-ledger:v0.2';
  const nowIso = () => new Date().toISOString();
  const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

  const initialData = {
    schemaVersion: 2,
    activeBusinessId: 'biz_play_it_forward',
    businesses: [{
      id: 'biz_play_it_forward',
      displayName: 'Play It Forward',
      legalName: 'Play It Forward',
      entityType: 'Sole proprietor',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }],
    clients: [],
    sessions: [],
    auditEvents: [],
  };

  const deepClone = (value) => JSON.parse(JSON.stringify(value));

  class LocalRepository {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return deepClone(initialData);
        const parsed = JSON.parse(raw);
        return parsed?.schemaVersion === 2 ? parsed : deepClone(initialData);
      } catch (error) {
        console.warn('Could not load local workspace.', error);
        return deepClone(initialData);
      }
    }
    save(data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    export(data) {
      return JSON.stringify(data, null, 2);
    }
  }

  // Provider-neutral boundary. A later cloud repository can implement the same
  // load/save contract plus authenticated sync without changing domain/UI code.
  const repository = new LocalRepository();
  const data = repository.load();
  const ui = { activeView: 'home', modal: null, workTab: 'sessions', formMode: null, formRecordId: null };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const views = $$('[data-page]');
  const navButtons = $$('[data-view]');
  const overlay = $('#overlay');
  const modals = [$('#quickAddSheet'), $('#commandPalette'), $('#businessSheet'), $('#formSheet'), $('#settingsSheet'), $('#detailPanel')];
  const toast = $('#toast');

  function persist(eventType, entityType, entityId, details = {}) {
    if (eventType) {
      data.auditEvents.push({ id: uid('audit'), businessId: data.activeBusinessId, eventType, entityType, entityId, details, occurredAt: nowIso() });
    }
    repository.save(data);
  }

  function activeBusiness() {
    return data.businesses.find(b => b.id === data.activeBusinessId) || data.businesses[0];
  }

  function businessClients(businessId = data.activeBusinessId) {
    return data.clients.filter(c => c.businessId === businessId);
  }

  function businessSessions(businessId = data.activeBusinessId) {
    return data.sessions.filter(s => s.businessId === businessId);
  }

  function clientById(id) { return data.clients.find(c => c.id === id); }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0,2).map(p => p[0]).join('').toUpperCase();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
  }

  function formatMoney(cents = 0, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
  }

  function formatDate(dateString, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
    if (!dateString) return '—';
    const date = dateString.length === 10 ? new Date(`${dateString}T12:00:00`) : new Date(dateString);
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  function minutesBetween(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let minutes = eh * 60 + em - (sh * 60 + sm);
    if (minutes < 0) minutes += 24 * 60;
    return Math.max(0, minutes);
  }

  function sessionMinutes(session) { return session.durationMinutes ?? minutesBetween(session.startTime, session.endTime); }
  function sessionAmountCents(session) { return Math.round(sessionMinutes(session) / 60 * (session.rateCents || 0)); }
  function hoursLabel(minutes) { return `${(minutes / 60).toFixed(minutes % 60 ? 1 : 0)}h`; }

  function setView(viewName) {
    ui.activeView = viewName;
    views.forEach(view => view.classList.toggle('active', view.dataset.page === viewName));
    navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.view === viewName));
    window.scrollTo({ top: 0, behavior: 'auto' });
    closeModal();
  }

  function openModal(modal) {
    closeModal(false);
    ui.modal = modal;
    overlay.hidden = false;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (modal === $('#commandPalette')) setTimeout(() => $('#commandInput').focus(), 40);
    if (modal === $('#formSheet')) setTimeout(() => $('#dynamicForm input, #dynamicForm select, #dynamicForm textarea')?.focus(), 60);
  }

  function closeModal(hideOverlay = true) {
    modals.forEach(item => { if (item) item.hidden = true; });
    ui.modal = null;
    if (hideOverlay) overlay.hidden = true;
    document.body.style.overflow = '';
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2300);
  }

  function renderWorkspaceChrome() {
    const biz = activeBusiness();
    if (!biz) return;
    $('#businessName').textContent = biz.displayName;
    $('#businessType').textContent = biz.entityType;
    $('#businessInitials').textContent = initials(biz.displayName);
    $('#mobileBusinessName').textContent = biz.displayName;
    $('#mobileBusinessInitials').textContent = initials(biz.displayName);
    $('#homeEyebrow').textContent = biz.displayName.toUpperCase();
  }

  function renderWorkspaceOptions() {
    $('#workspaceOptions').innerHTML = data.businesses.map(b => `
      <button class="workspace-option ${b.id === data.activeBusinessId ? 'selected' : ''}" data-business-id="${b.id}">
        <span class="business-icon">${escapeHtml(initials(b.displayName))}</span>
        <span><strong>${escapeHtml(b.displayName)}</strong><small>${escapeHtml(b.entityType)}</small></span>
        ${b.id === data.activeBusinessId ? '<span class="workspace-check">✓</span>' : ''}
      </button>`).join('');
    $$('[data-business-id]').forEach(btn => btn.addEventListener('click', () => {
      data.activeBusinessId = btn.dataset.businessId;
      persist('workspace_switched', 'Business', btn.dataset.businessId);
      renderAll();
      closeModal();
      showToast(`Switched to ${activeBusiness().displayName}`);
    }));
  }

  function renderHome() {
    const clients = businessClients().filter(c => c.status === 'active');
    const sessions = businessSessions();
    const monthKey = new Date().toISOString().slice(0,7);
    const monthly = sessions.filter(s => s.date?.slice(0,7) === monthKey);
    const totalMinutes = monthly.reduce((sum, s) => sum + sessionMinutes(s), 0);
    const uninvoicedCents = sessions.filter(s => s.invoiceStatus !== 'invoiced').reduce((sum, s) => sum + sessionAmountCents(s), 0);

    $('#metricClients').textContent = clients.length;
    $('#metricHours').textContent = (totalMinutes / 60).toFixed(totalMinutes % 60 ? 1 : 0);
    $('#metricUninvoiced').textContent = formatMoney(uninvoicedCents, activeBusiness().currency);
    $('#clientTabCount').textContent = businessClients().length;
    $('#sessionTabCount').textContent = sessions.length;

    const incomplete = sessions.filter(s => !s.clientId || !s.date || !s.startTime || !s.endTime);
    $('#attentionCount').textContent = `${incomplete.length} ${incomplete.length === 1 ? 'item' : 'items'}`;
    $('#attentionTitle').textContent = incomplete.length ? 'A few records need review.' : 'Nothing needs your attention.';
    $('#attentionBody').innerHTML = incomplete.length
      ? `<div class="attention-list">${incomplete.slice(0,3).map(s => `<button data-session-detail="${s.id}"><strong>Incomplete work session</strong><small>${escapeHtml(clientById(s.clientId)?.displayName || 'No client')} · ${formatDate(s.date)}</small></button>`).join('')}</div>`
      : `<p class="panel-copy">As data grows, this becomes the single queue for missing session details, overdue invoices, receipts, mileage review, and tax reminders.</p>`;

    $('#recentSessions').innerHTML = sessions.length ? sessions
      .slice().sort((a,b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)).slice(0,4)
      .map(sessionRowCompact).join('') : `<div class="inline-empty"><strong>No sessions yet</strong><small>Add your first work session and it will appear here.</small></div>`;

    $$('[data-session-detail]').forEach(btn => btn.addEventListener('click', () => openSessionDetail(btn.dataset.sessionDetail)));
  }

  function sessionRowCompact(s) {
    const client = clientById(s.clientId);
    return `<button class="recent-row" data-session-detail="${s.id}"><span class="recent-date"><strong>${formatDate(s.date,{month:'short'})}</strong><small>${formatDate(s.date,{day:'numeric'})}</small></span><span class="recent-main"><strong>${escapeHtml(client?.displayName || 'Unassigned')}</strong><small>${escapeHtml(s.startTime || '—')}–${escapeHtml(s.endTime || '—')} · ${hoursLabel(sessionMinutes(s))}</small></span><span class="recent-amount">${formatMoney(sessionAmountCents(s), activeBusiness().currency)}</span></button>`;
  }

  function renderSessions() {
    const term = ($('#sessionSearch')?.value || '').toLowerCase().trim();
    const sessions = businessSessions().slice().sort((a,b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)).filter(s => {
      const client = clientById(s.clientId);
      return !term || `${client?.displayName || ''} ${s.date || ''} ${s.notes || ''}`.toLowerCase().includes(term);
    });

    $('#sessionsContainer').innerHTML = sessions.length ? `
      <div class="table-head session-grid"><span>Date</span><span>Client</span><span>Time</span><span>Value</span><span>Status</span></div>
      ${sessions.map(s => {
        const client = clientById(s.clientId);
        return `<button class="table-row session-grid" data-session-detail="${s.id}"><span><strong>${formatDate(s.date,{month:'short',day:'numeric'})}</strong><small>${formatDate(s.date,{weekday:'short'})}</small></span><span><strong>${escapeHtml(client?.displayName || 'Unassigned')}</strong><small>${escapeHtml(s.notes || 'No session note')}</small></span><span><strong>${escapeHtml(s.startTime || '—')}–${escapeHtml(s.endTime || '—')}</strong><small>${hoursLabel(sessionMinutes(s))}</small></span><span><strong>${formatMoney(sessionAmountCents(s), activeBusiness().currency)}</strong><small>@ ${formatMoney(s.rateCents || 0)}/hr</small></span><span><span class="status-pill ${s.invoiceStatus === 'invoiced' ? 'success' : ''}">${s.invoiceStatus === 'invoiced' ? 'Invoiced' : 'Uninvoiced'}</span></span></button>`;
      }).join('')}` : emptyState('No work sessions yet', 'Log completed work here. Later, this same record will flow into invoices and mileage.', 'Add work session', 'add-session');

    $$('[data-session-detail]').forEach(btn => btn.addEventListener('click', () => openSessionDetail(btn.dataset.sessionDetail)));
    bindEmptyActions();
  }

  function renderClients() {
    const term = ($('#clientSearch')?.value || '').toLowerCase().trim();
    const clients = businessClients().filter(c => !term || `${c.displayName} ${c.notes || ''}`.toLowerCase().includes(term));
    $('#clientsContainer').innerHTML = clients.length ? clients.map(c => {
      const sessions = businessSessions().filter(s => s.clientId === c.id);
      const minutes = sessions.reduce((sum,s) => sum + sessionMinutes(s), 0);
      return `<button class="client-card" data-client-detail="${c.id}"><div class="client-top"><span class="client-avatar">${escapeHtml(initials(c.displayName))}</span><span class="status-pill ${c.status === 'active' ? 'success' : ''}">${escapeHtml(c.status)}</span></div><strong>${escapeHtml(c.displayName)}</strong><small>${escapeHtml(c.notes || 'No notes yet')}</small><div class="client-meta"><span><b>${formatMoney(c.defaultRateCents || 0)}</b><small>/hr default</small></span><span><b>${sessions.length}</b><small>sessions</small></span><span><b>${hoursLabel(minutes)}</b><small>logged</small></span></div></button>`;
    }).join('') : emptyState('No clients yet', 'Add the people or organizations you do work for. Names can be aliases if you prefer.', 'Add first client', 'add-client');
    $$('[data-client-detail]').forEach(btn => btn.addEventListener('click', () => openClientDetail(btn.dataset.clientDetail)));
    bindEmptyActions();
  }

  function emptyState(title, copy, actionLabel, action) {
    return `<div class="large-empty"><div class="placeholder-icon small">＋</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p><button class="secondary-btn" data-empty-action="${action}">${escapeHtml(actionLabel)}</button></div>`;
  }

  function bindEmptyActions() {
    $$('[data-empty-action]').forEach(btn => btn.addEventListener('click', () => btn.dataset.emptyAction === 'add-client' ? openClientForm() : openSessionForm()));
  }

  function renderWork() { renderSessions(); renderClients(); }

  function renderCommandPalette() {
    const term = ($('#commandInput').value || '').toLowerCase().trim();
    const navigation = [
      ['home','⌂','Home','Dashboard and attention queue'], ['work','◫','Work','Clients and sessions'], ['money','$','Money','Invoices, payments, and expenses'], ['records','▤','Records','Documents and evidence']
    ].filter(item => !term || item.slice(2).join(' ').toLowerCase().includes(term));
    const clients = businessClients().filter(c => term && c.displayName.toLowerCase().includes(term)).slice(0,5);
    const sessions = businessSessions().filter(s => {
      const c = clientById(s.clientId); return term && `${c?.displayName || ''} ${s.date} ${s.notes || ''}`.toLowerCase().includes(term);
    }).slice(0,5);

    $('#commandBody').innerHTML = `${navigation.length ? `<p class="command-label">Navigation</p>${navigation.map(n => `<button class="command-result" data-command-view="${n[0]}"><span>${n[1]}</span><div><strong>${n[2]}</strong><small>${n[3]}</small></div></button>`).join('')}` : ''}
      ${clients.length ? `<p class="command-label">Clients</p>${clients.map(c => `<button class="command-result" data-command-client="${c.id}"><span>${escapeHtml(initials(c.displayName))}</span><div><strong>${escapeHtml(c.displayName)}</strong><small>Client · ${formatMoney(c.defaultRateCents || 0)}/hr</small></div></button>`).join('')}` : ''}
      ${sessions.length ? `<p class="command-label">Sessions</p>${sessions.map(s => `<button class="command-result" data-command-session="${s.id}"><span>◫</span><div><strong>${escapeHtml(clientById(s.clientId)?.displayName || 'Unassigned')}</strong><small>${formatDate(s.date)} · ${hoursLabel(sessionMinutes(s))}</small></div></button>`).join('')}` : ''}
      ${term && !navigation.length && !clients.length && !sessions.length ? `<div class="command-empty">No local records match “${escapeHtml(term)}”.</div>` : ''}`;
    $$('[data-command-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.commandView)));
    $$('[data-command-client]').forEach(btn => btn.addEventListener('click', () => { closeModal(); setView('work'); openClientDetail(btn.dataset.commandClient); }));
    $$('[data-command-session]').forEach(btn => btn.addEventListener('click', () => { closeModal(); setView('work'); openSessionDetail(btn.dataset.commandSession); }));
  }

  function openClientForm(existingId = null) {
    const existing = existingId ? data.clients.find(c => c.id === existingId) : null;
    ui.formMode = 'client'; ui.formRecordId = existingId;
    $('#formEyebrow').textContent = existing ? 'EDIT CLIENT' : 'ADD CLIENT';
    $('#formTitle').textContent = existing ? existing.displayName : 'New client';
    $('#formSubmitBtn').textContent = existing ? 'Save changes' : 'Add client';
    $('#formFields').innerHTML = `
      <label class="field"><span>Client / payer name</span><input name="displayName" required maxlength="100" placeholder="e.g. Client A" value="${escapeHtml(existing?.displayName || '')}" /><small>You can use an alias if you do not want identifying client information in the prototype.</small></label>
      <div class="field-row"><label class="field"><span>Default hourly rate</span><div class="money-input"><span>$</span><input name="rate" required inputmode="decimal" min="0" step="0.01" type="number" placeholder="0.00" value="${existing ? (existing.defaultRateCents/100).toFixed(2) : ''}" /></div></label><label class="field"><span>Status</span><select name="status"><option value="active" ${existing?.status !== 'inactive' ? 'selected' : ''}>Active</option><option value="inactive" ${existing?.status === 'inactive' ? 'selected' : ''}>Inactive</option></select></label></div>
      <label class="field"><span>Notes <em>optional</em></span><textarea name="notes" rows="3" maxlength="500" placeholder="Billing arrangement, general context, or reminder…">${escapeHtml(existing?.notes || '')}</textarea></label>`;
    openModal($('#formSheet'));
  }

  function openSessionForm(existingId = null) {
    const existing = existingId ? data.sessions.find(s => s.id === existingId) : null;
    const clients = businessClients().filter(c => c.status === 'active' || c.id === existing?.clientId);
    if (!clients.length && !existing) {
      showToast('Add a client before logging a work session.');
      openClientForm();
      return;
    }
    ui.formMode = 'session'; ui.formRecordId = existingId;
    $('#formEyebrow').textContent = existing ? 'EDIT SESSION' : 'LOG WORK';
    $('#formTitle').textContent = existing ? 'Edit work session' : 'New work session';
    $('#formSubmitBtn').textContent = existing ? 'Save changes' : 'Log session';
    const today = new Date().toISOString().slice(0,10);
    $('#formFields').innerHTML = `
      <label class="field"><span>Client</span><select name="clientId" id="sessionClient" required><option value="">Choose client</option>${clients.map(c => `<option value="${c.id}" data-rate="${c.defaultRateCents || 0}" ${c.id === existing?.clientId ? 'selected' : ''}>${escapeHtml(c.displayName)}</option>`).join('')}</select></label>
      <div class="field-row three"><label class="field"><span>Date</span><input name="date" type="date" required value="${existing?.date || today}" /></label><label class="field"><span>Start</span><input name="startTime" type="time" required value="${existing?.startTime || ''}" /></label><label class="field"><span>End</span><input name="endTime" type="time" required value="${existing?.endTime || ''}" /></label></div>
      <label class="field"><span>Hourly rate for this session</span><div class="money-input"><span>$</span><input name="rate" id="sessionRate" required inputmode="decimal" min="0" step="0.01" type="number" value="${existing ? (existing.rateCents/100).toFixed(2) : ''}" placeholder="0.00" /></div><small>The rate is copied into this session so future client rate changes do not rewrite old work.</small></label>
      <label class="field"><span>Session note <em>optional</em></span><textarea name="notes" rows="3" maxlength="500" placeholder="Brief work note or billing context…">${escapeHtml(existing?.notes || '')}</textarea></label>`;
    openModal($('#formSheet'));
    const select = $('#sessionClient');
    if (!existing && clients.length === 1) { select.value = clients[0].id; $('#sessionRate').value = (clients[0].defaultRateCents/100).toFixed(2); }
    select.addEventListener('change', () => { const option = select.selectedOptions[0]; if (option?.dataset.rate) $('#sessionRate').value = (Number(option.dataset.rate)/100).toFixed(2); });
  }

  function openBusinessForm() {
    ui.formMode = 'business'; ui.formRecordId = null;
    $('#formEyebrow').textContent = 'NEW WORKSPACE'; $('#formTitle').textContent = 'Add business or gig'; $('#formSubmitBtn').textContent = 'Create workspace';
    $('#formFields').innerHTML = `
      <label class="field"><span>Display name</span><input name="displayName" required maxlength="100" placeholder="Business or gig name" /></label>
      <label class="field"><span>Type</span><select name="entityType"><option>Sole proprietor</option><option>Independent gig</option><option>Other business</option></select></label>
      <label class="field"><span>Timezone</span><input name="timezone" value="America/Los_Angeles" required /></label>`;
    openModal($('#formSheet'));
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (ui.formMode === 'client') {
      const payload = { displayName: form.get('displayName').trim(), defaultRateCents: Math.round(Number(form.get('rate')) * 100), status: form.get('status'), notes: form.get('notes').trim() };
      if (ui.formRecordId) {
        const client = data.clients.find(c => c.id === ui.formRecordId);
        const before = deepClone(client); Object.assign(client, payload, { updatedAt: nowIso() });
        persist('updated', 'Client', client.id, { before, after: deepClone(client) }); showToast('Client updated');
      } else {
        const client = { id: uid('client'), businessId: data.activeBusinessId, ...payload, createdAt: nowIso(), updatedAt: nowIso() };
        data.clients.push(client); persist('created', 'Client', client.id); showToast('Client added');
      }
    }
    if (ui.formMode === 'session') {
      const startTime = form.get('startTime'), endTime = form.get('endTime');
      const durationMinutes = minutesBetween(startTime, endTime);
      if (!durationMinutes) { showToast('End time must be after the start time.'); return; }
      const payload = { clientId: form.get('clientId'), date: form.get('date'), startTime, endTime, durationMinutes, rateCents: Math.round(Number(form.get('rate')) * 100), notes: form.get('notes').trim(), invoiceStatus: 'uninvoiced' };
      if (ui.formRecordId) {
        const session = data.sessions.find(s => s.id === ui.formRecordId); const before = deepClone(session);
        Object.assign(session, payload, { updatedAt: nowIso() }); persist('updated', 'WorkSession', session.id, { before, after: deepClone(session) }); showToast('Work session updated');
      } else {
        const session = { id: uid('session'), businessId: data.activeBusinessId, ...payload, createdAt: nowIso(), updatedAt: nowIso() };
        data.sessions.push(session); persist('created', 'WorkSession', session.id); showToast('Work session logged');
      }
    }
    if (ui.formMode === 'business') {
      const business = { id: uid('biz'), displayName: form.get('displayName').trim(), legalName: form.get('displayName').trim(), entityType: form.get('entityType'), currency: 'USD', timezone: form.get('timezone').trim(), status: 'active', createdAt: nowIso(), updatedAt: nowIso() };
      data.businesses.push(business); data.activeBusinessId = business.id; persist('created', 'Business', business.id); showToast('Workspace created');
    }
    closeModal(); renderAll(); setView(ui.formMode === 'business' ? 'home' : 'work');
  }

  function openClientDetail(id) {
    const client = data.clients.find(c => c.id === id); if (!client) return;
    const sessions = data.sessions.filter(s => s.clientId === id).sort((a,b) => b.date.localeCompare(a.date));
    const minutes = sessions.reduce((sum,s) => sum + sessionMinutes(s), 0);
    $('#detailEyebrow').textContent = 'CLIENT'; $('#detailTitle').textContent = client.displayName;
    $('#detailBody').innerHTML = `<div class="detail-actions"><button class="secondary-btn" data-edit-client="${client.id}">Edit</button><button class="primary-btn" data-new-session-client="${client.id}">＋ Log session</button></div>
      <div class="detail-metrics"><div><small>Default rate</small><strong>${formatMoney(client.defaultRateCents || 0)}/hr</strong></div><div><small>Sessions</small><strong>${sessions.length}</strong></div><div><small>Hours logged</small><strong>${hoursLabel(minutes)}</strong></div></div>
      <div class="detail-section"><p class="eyebrow">NOTES</p><p>${escapeHtml(client.notes || 'No client notes yet.')}</p></div>
      <div class="detail-section"><div class="panel-title-row"><p class="eyebrow">RECENT SESSIONS</p></div>${sessions.length ? `<div class="recent-list">${sessions.slice(0,5).map(sessionRowCompact).join('')}</div>` : '<div class="inline-empty"><small>No sessions for this client yet.</small></div>'}</div>`;
    openModal($('#detailPanel'));
    $('[data-edit-client]')?.addEventListener('click', () => openClientForm(id));
    $('[data-new-session-client]')?.addEventListener('click', () => { closeModal(); openSessionForm(); setTimeout(() => { $('#sessionClient').value = id; $('#sessionRate').value = (client.defaultRateCents/100).toFixed(2); }, 20); });
    $$('[data-session-detail]', $('#detailBody')).forEach(btn => btn.addEventListener('click', () => openSessionDetail(btn.dataset.sessionDetail)));
  }

  function openSessionDetail(id) {
    const s = data.sessions.find(session => session.id === id); if (!s) return;
    const client = clientById(s.clientId);
    $('#detailEyebrow').textContent = 'WORK SESSION'; $('#detailTitle').textContent = client?.displayName || 'Unassigned session';
    $('#detailBody').innerHTML = `<div class="detail-actions"><button class="secondary-btn" data-edit-session="${s.id}">Edit session</button><button class="primary-btn disabled-action" title="Invoice engine arrives in Phase 2">Create invoice · Phase 2</button></div>
      <div class="detail-metrics"><div><small>Date</small><strong>${formatDate(s.date,{month:'short',day:'numeric',year:'numeric'})}</strong></div><div><small>Time</small><strong>${escapeHtml(s.startTime)}–${escapeHtml(s.endTime)}</strong></div><div><small>Duration</small><strong>${hoursLabel(sessionMinutes(s))}</strong></div></div>
      <div class="detail-section"><div class="trace-row"><span>Session value</span><strong>${formatMoney(sessionAmountCents(s), activeBusiness().currency)}</strong></div><div class="trace-row"><span>Rate snapshot</span><strong>${formatMoney(s.rateCents || 0)}/hr</strong></div><div class="trace-row"><span>Invoice state</span><strong>Uninvoiced</strong></div></div>
      <div class="detail-section"><p class="eyebrow">SESSION NOTE</p><p>${escapeHtml(s.notes || 'No session note.')}</p></div>
      <div class="trace-banner"><span>↳</span><div><strong>Traceability anchor</strong><small>Invoices, mileage, and direct job expenses will attach to this session in later phases.</small></div></div>`;
    openModal($('#detailPanel'));
    $('[data-edit-session]')?.addEventListener('click', () => openSessionForm(id));
  }

  function exportBackup() {
    const blob = new Blob([repository.export(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `business-ledger-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0); showToast('Local backup exported');
  }

  function renderAll() {
    renderWorkspaceChrome(); renderWorkspaceOptions(); renderHome(); renderWork(); renderCommandPalette();
  }

  navButtons.forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
  $$('[data-go-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.goView)));
  $('#quickAddBtn').addEventListener('click', () => openModal($('#quickAddSheet')));
  $('#mobileAddBtn').addEventListener('click', () => openModal($('#quickAddSheet')));
  $$('[data-open-add]').forEach(btn => btn.addEventListener('click', () => openModal($('#quickAddSheet'))));
  $('#searchTrigger').addEventListener('click', () => { $('#commandInput').value = ''; renderCommandPalette(); openModal($('#commandPalette')); });
  $('#businessSwitcher').addEventListener('click', () => { renderWorkspaceOptions(); openModal($('#businessSheet')); });
  $('#mobileBusinessSwitcher').addEventListener('click', () => { renderWorkspaceOptions(); openModal($('#businessSheet')); });
  $('#openSettings').addEventListener('click', () => openModal($('#settingsSheet')));
  $('#syncChip').addEventListener('click', () => openModal($('#settingsSheet')));
  $('#profileBtn').addEventListener('click', () => openModal($('#settingsSheet')));
  $('#notificationBtn').addEventListener('click', () => showToast('No notifications yet. Attention items will surface here later.'));
  $('#addClientBtn').addEventListener('click', () => openClientForm());
  $('#addSessionBtn').addEventListener('click', () => openSessionForm());
  $('#addBusinessBtn').addEventListener('click', () => openBusinessForm());
  $('#dynamicForm').addEventListener('submit', handleFormSubmit);
  $('#exportBackupBtn').addEventListener('click', exportBackup);
  $('#exportBackupFromRecords').addEventListener('click', exportBackup);
  overlay.addEventListener('click', () => closeModal());
  $$('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal()));

  $$('.quick-card').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.action === 'add-client') { closeModal(); openClientForm(); return; }
    if (btn.dataset.action === 'add-session') { closeModal(); openSessionForm(); return; }
    showToast(`${$('strong', btn).textContent} activates in its roadmap phase.`);
  }));

  $$('[data-work-tab]').forEach(btn => btn.addEventListener('click', () => {
    ui.workTab = btn.dataset.workTab;
    $$('[data-work-tab]').forEach(b => b.classList.toggle('active', b === btn));
    $$('[data-work-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.workPanel === ui.workTab));
  }));
  $('#sessionSearch').addEventListener('input', renderSessions);
  $('#clientSearch').addEventListener('input', renderClients);
  $('#sessionFilterBtn').addEventListener('click', () => showToast('Session filters arrive with invoice states in Phase 2.'));
  $('#clientFilterBtn').addEventListener('click', () => showToast('All client states are currently shown.'));
  $('#commandInput').addEventListener('input', renderCommandPalette);

  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); $('#commandInput').value = ''; renderCommandPalette(); openModal($('#commandPalette')); }
    if (event.key === 'Escape' && ui.modal) closeModal();
  });

  renderAll();
})();
