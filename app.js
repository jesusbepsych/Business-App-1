(() => {
  'use strict';

  const STORAGE_KEY = 'business-ledger:v0.2';
  const SIDEBAR_COLLAPSE_KEY = 'business-ledger-sidebar-collapsed';
  const nowIso = () => new Date().toISOString();
  const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
  const CLIENT_COLOR_KEYS = ['blue','teal','green','amber','coral','purple','pink','sky'];
  const EXPENSE_CATEGORIES = [
    ['supplies','Supplies'],['vehicle_fuel','Vehicle & fuel'],['parking_tolls','Parking & tolls'],['phone_internet','Phone & internet'],['software','Software'],['training','Training & education'],['insurance','Insurance'],['marketing','Marketing'],['meals','Meals'],['fees','Fees'],['equipment','Equipment'],['other','Other']
  ];
  const defaultClientColorForIndex = (index = 0) => CLIENT_COLOR_KEYS[Math.abs(Number(index) || 0) % CLIENT_COLOR_KEYS.length];

  const initialData = {
    schemaVersion: 6,
    activeBusinessId: 'biz_play_it_forward',
    businesses: [{
      id: 'biz_play_it_forward',
      displayName: 'Play It Forward',
      legalName: 'Play It Forward',
      entityType: 'Sole proprietor',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      status: 'active',
      invoiceSettings: { prefix: 'INV', nextNumber: 1, defaultDueDays: 7, senderEmail: '', senderPhone: '', senderAddress: '', paymentInstructions: '' },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }],
    clients: [],
    sessions: [],
    invoices: [],
    payments: [],
    expenses: [],
    receipts: [],
    auditEvents: [],
  };

  const deepClone = (value) => JSON.parse(JSON.stringify(value));

  function invoiceDefaults() {
    return { prefix: 'INV', nextNumber: 1, defaultDueDays: 7, senderEmail: '', senderPhone: '', senderAddress: '', paymentInstructions: '' };
  }

  function migrateData(parsed) {
    if (!parsed || typeof parsed !== 'object') return deepClone(initialData);
    if (parsed.schemaVersion === 2) {
      parsed.schemaVersion = 6;
      parsed.invoices = [];
      parsed.payments = [];
      parsed.expenses = [];
      parsed.receipts = [];
      parsed.businesses = (parsed.businesses || []).map(b => ({ ...b, invoiceSettings: { ...invoiceDefaults(), ...(b.invoiceSettings || {}) } }));
      const clientNames = new Map((parsed.clients || []).map(c => [c.id, c.displayName]));
      parsed.clients = (parsed.clients || []).map((c, index) => ({ billingEmail: '', billingAddress: '', colorKey: c.colorKey || defaultClientColorForIndex(index), ...c }));
      parsed.sessions = (parsed.sessions || []).map(s => ({ invoiceId: null, clientNameSnapshot: clientNames.get(s.clientId) || '', ...s }));
      return parsed;
    }
    if (parsed.schemaVersion === 3) {
      parsed.schemaVersion = 6;
      parsed.invoices ||= [];
      parsed.payments = [];
      parsed.expenses = [];
      parsed.receipts = [];
      parsed.businesses = (parsed.businesses || []).map(b => ({ ...b, invoiceSettings: { ...invoiceDefaults(), ...(b.invoiceSettings || {}) } }));
      parsed.clients = (parsed.clients || []).map((c, index) => ({ billingEmail: '', billingAddress: '', colorKey: c.colorKey || defaultClientColorForIndex(index), ...c }));
      parsed.sessions = (parsed.sessions || []).map(s => ({ invoiceId: null, clientNameSnapshot: '', ...s }));
      return parsed;
    }
    if (parsed.schemaVersion === 4 || parsed.schemaVersion === 5) {
      parsed.schemaVersion = 6;
      parsed.invoices ||= [];
      parsed.payments ||= [];
      parsed.expenses ||= [];
      parsed.receipts ||= [];
      parsed.businesses = (parsed.businesses || []).map(b => ({ ...b, invoiceSettings: { ...invoiceDefaults(), ...(b.invoiceSettings || {}) } }));
      parsed.clients = (parsed.clients || []).map((c, index) => ({ billingEmail: '', billingAddress: '', colorKey: c.colorKey || defaultClientColorForIndex(index), ...c }));
      parsed.sessions = (parsed.sessions || []).map(s => ({ invoiceId: null, clientNameSnapshot: '', ...s }));
      return parsed;
    }
    if (parsed.schemaVersion === 6) {
      parsed.invoices ||= [];
      parsed.payments ||= [];
      parsed.expenses ||= [];
      parsed.receipts ||= [];
      parsed.businesses = (parsed.businesses || []).map(b => ({ ...b, invoiceSettings: { ...invoiceDefaults(), ...(b.invoiceSettings || {}) } }));
      parsed.clients = (parsed.clients || []).map((c, index) => ({ billingEmail: '', billingAddress: '', colorKey: c.colorKey || defaultClientColorForIndex(index), ...c }));
      parsed.sessions = (parsed.sessions || []).map(s => ({ invoiceId: null, clientNameSnapshot: '', ...s }));
      return parsed;
    }
    return deepClone(initialData);
  }

  class LocalRepository {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return deepClone(initialData);
        return migrateData(JSON.parse(raw));
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


  class ReceiptBlobStore {
    constructor() { this.dbName = 'business-ledger-receipts'; this.storeName = 'files'; this.version = 1; }
    open() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName, { keyPath: 'id' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    async put(id, file) {
      const db = await this.open();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).put({ id, blob: file });
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
      db.close();
    }
    async get(id) {
      if (!id) return null;
      const db = await this.open();
      const result = await new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const request = tx.objectStore(this.storeName).get(id);
        request.onsuccess = () => resolve(request.result?.blob || null);
        request.onerror = () => reject(request.error);
      });
      db.close(); return result;
    }
    async delete(id) {
      if (!id) return;
      const db = await this.open();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).delete(id);
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
      db.close();
    }
  }

  // Provider-neutral boundary. A later cloud repository can implement the same
  // load/save contract plus authenticated sync without changing domain/UI code.
  const repository = new LocalRepository();
  const receiptBlobStore = new ReceiptBlobStore();
  const data = repository.load();
  const ui = { activeView: 'home', modal: null, workTab: 'sessions', moneyTab: 'invoices', formMode: null, formRecordId: null, sessionFilter: 'all', clientFilter: 'active', sessionPage: 1, sessionPageSize: 7, invoiceFilter: 'all', invoicePage: 1, invoicePageSize: 7, paymentFilter: 'all', paymentPage: 1, paymentPageSize: 7, expenseFilter: 'all', expensePage: 1, expensePageSize: 7, invoiceFormId: null };
  let homeRecentRotationTimer = null;
  let homeRecentSignature = '';
  let homeRecentSwapTimer = null;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const views = $$('[data-page]');
  const navButtons = $$('[data-view]');
  const overlay = $('#overlay');
  const modals = [$('#quickAddSheet'), $('#commandPalette'), $('#businessSheet'), $('#formSheet'), $('#invoiceSheet'), $('#settingsSheet'), $('#detailPanel')];
  const toast = $('#toast');
  const appShell = $('#appShell');
  const sidebarCollapseBtn = $('#sidebarCollapseBtn');
  const homeAtriumScene = $('#homeAtriumScene');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let atriumFrame = null;
  let atriumPointerX = 0;
  let atriumPointerY = 0;
  let atriumMotionProfile = 'desktop';
  let activeFilterMenu = null;

  function readSidebarCollapsedPreference() {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      return saved === null ? true : saved === '1';
    } catch (error) {
      return true;
    }
  }

  function applySidebarCollapsed(collapsed, { persist = true } = {}) {
    if (!appShell || !sidebarCollapseBtn) return;
    appShell.classList.toggle('sidebar-collapsed', collapsed);
    document.documentElement.classList.remove('sidebar-collapsed-preload');
    sidebarCollapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    sidebarCollapseBtn.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
    sidebarCollapseBtn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
    if (persist) {
      try { localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? '1' : '0'); }
      catch (error) { /* Sidebar preference is non-critical. */ }
    }
  }

  applySidebarCollapsed(readSidebarCollapsedPreference(), { persist: false });

  function closeFilterMenu() {
    if (!activeFilterMenu) return;
    activeFilterMenu.anchor?.setAttribute('aria-expanded', 'false');
    activeFilterMenu.menu?.remove();
    activeFilterMenu = null;
  }

  function openFilterMenu(anchor, items, currentValue, onSelect) {
    if (activeFilterMenu?.anchor === anchor) { closeFilterMenu(); return; }
    closeFilterMenu();
    const menu = document.createElement('div');
    menu.className = 'filter-popover';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = items.map(item => `<button type="button" role="menuitemradio" aria-checked="${item.value === currentValue}" class="filter-menu-item ${item.value === currentValue ? 'selected' : ''}" data-filter-value="${escapeHtml(item.value)}"><span>${escapeHtml(item.label)}</span><span class="filter-menu-check" aria-hidden="true">${item.value === currentValue ? '✓' : ''}</span></button>`).join('');
    document.body.appendChild(menu);
    anchor.setAttribute('aria-expanded', 'true');
    activeFilterMenu = { anchor, menu };

    const rect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    let left = rect.right - menuRect.width;
    let top = rect.bottom + 7;
    left = Math.max(10, Math.min(left, window.innerWidth - menuRect.width - 10));
    if (top + menuRect.height > window.innerHeight - 10) top = Math.max(10, rect.top - menuRect.height - 7);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    $$('[data-filter-value]', menu).forEach(item => item.addEventListener('click', event => {
      event.stopPropagation();
      const value = item.dataset.filterValue;
      closeFilterMenu();
      onSelect(value);
    }));
  }

  document.addEventListener('pointerdown', event => {
    if (!activeFilterMenu) return;
    if (activeFilterMenu.menu.contains(event.target) || activeFilterMenu.anchor.contains(event.target)) return;
    closeFilterMenu();
  });

  function persist(eventType, entityType, entityId, details = {}) {
    if (eventType) {
      data.auditEvents.push({ id: uid('audit'), businessId: data.activeBusinessId, eventType, entityType, entityId, details, occurredAt: nowIso() });
    }
    repository.save(data);
  }

  function activeBusiness() {
    return data.businesses.find(b => b.id === data.activeBusinessId) || data.businesses[0];
  }

  function businessTimeZone(business = activeBusiness()) {
    const fallback = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const candidate = business?.timezone || fallback;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
      return candidate;
    } catch (error) {
      console.warn('Invalid workspace timezone; falling back to device timezone.', candidate, error);
      return fallback;
    }
  }

  function zonedNowParts(business = activeBusiness(), instant = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: businessTimeZone(business),
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(instant);
    const value = type => parts.find(part => part.type === type)?.value || '';
    return { year: value('year'), month: value('month'), day: value('day'), hour: Number(value('hour') || 0), minute: Number(value('minute') || 0) };
  }

  function businessToday(business = activeBusiness()) {
    const parts = zonedNowParts(business);
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function businessMonthKey(business = activeBusiness()) {
    return businessToday(business).slice(0, 7);
  }

  function businessClients(businessId = data.activeBusinessId) {
    return data.clients.filter(c => c.businessId === businessId);
  }

  function businessSessions(businessId = data.activeBusinessId) {
    return data.sessions.filter(s => s.businessId === businessId);
  }

  function businessInvoices(businessId = data.activeBusinessId) {
    return data.invoices.filter(invoice => invoice.businessId === businessId);
  }

  function businessPayments(businessId = data.activeBusinessId) {
    return data.payments.filter(payment => payment.businessId === businessId);
  }

  function businessExpenses(businessId = data.activeBusinessId) {
    return data.expenses.filter(expense => expense.businessId === businessId);
  }

  function businessReceipts(businessId = data.activeBusinessId) {
    return data.receipts.filter(receipt => receipt.businessId === businessId);
  }

  function clientById(id) { return data.clients.find(c => c.id === id); }
  function invoiceById(id) { return data.invoices.find(invoice => invoice.id === id); }
  function paymentById(id) { return data.payments.find(payment => payment.id === id); }
  function expenseById(id) { return data.expenses.find(expense => expense.id === id); }
  function receiptById(id) { return data.receipts.find(receipt => receipt.id === id); }
  function clientColorKey(client) { return CLIENT_COLOR_KEYS.includes(client?.colorKey) ? client.colorKey : 'blue'; }
  function clientColorClass(client) { return `client-color-${clientColorKey(client)}`; }

  function invoiceTotalCents(invoice) {
    return (invoice?.lineItems || []).reduce((sum, item) => sum + Number(item.amountCents || 0), 0);
  }

  function invoiceTotalMinutes(invoice) {
    return (invoice?.lineItems || []).reduce((sum, item) => item.type === 'session' ? sum + Number(item.quantityMinutes || 0) : sum, 0);
  }

  function invoicePayments(invoiceOrId) {
    const invoiceId = typeof invoiceOrId === 'string' ? invoiceOrId : invoiceOrId?.id;
    return data.payments.filter(payment => payment.businessId === data.activeBusinessId && payment.kind === 'invoice' && payment.invoiceId === invoiceId);
  }

  function invoicePaidCents(invoiceOrId) {
    return invoicePayments(invoiceOrId).reduce((sum, payment) => sum + Number(payment.amountCents || 0), 0);
  }

  function invoiceBalanceCents(invoice) {
    return Math.max(0, invoiceTotalCents(invoice) - invoicePaidCents(invoice));
  }

  function paymentSourceLabel(payment) {
    if (payment?.kind === 'invoice') return payment.invoiceNumberSnapshot || invoiceById(payment.invoiceId)?.number || 'Invoice';
    return payment?.sourceName || payment?.clientNameSnapshot || 'Other income';
  }

  function durationExactLabel(minutes = 0) {
    const total = Math.max(0, Math.round(Number(minutes) || 0));
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    if (!hours) return `${mins}m`;
    if (!mins) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  function invoiceDisplayStatus(invoice) {
    if (!invoice) return 'Draft';
    if (invoice.status === 'void') return 'Void';
    if (invoice.status === 'draft') return 'Draft';
    const paid = invoicePaidCents(invoice);
    const total = invoiceTotalCents(invoice);
    const balance = Math.max(0, total - paid);
    if (total > 0 && balance === 0) return 'Paid';
    const today = businessToday();
    if (invoice.status === 'sent' && balance > 0 && invoice.dueDate && invoice.dueDate < today) return 'Overdue';
    if (paid > 0 && balance > 0) return 'Partially paid';
    return invoice.status === 'sent' ? 'Sent' : invoice.status;
  }

  function invoiceNumberPreview(business = activeBusiness()) {
    const settings = { ...invoiceDefaults(), ...(business?.invoiceSettings || {}) };
    return `${settings.prefix || 'INV'}-${String(settings.nextNumber || 1).padStart(4,'0')}`;
  }

  function nextInvoiceNumber(business = activeBusiness()) {
    const settings = business.invoiceSettings ||= invoiceDefaults();
    const number = `${settings.prefix || 'INV'}-${String(settings.nextNumber || 1).padStart(4,'0')}`;
    settings.nextNumber = Number(settings.nextNumber || 1) + 1;
    business.updatedAt = nowIso();
    return number;
  }

  function addDays(dateString, days) {
    const [year, month, day] = String(dateString || '').split('-').map(Number);
    if (!year || !month || !day) return dateString;
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0,10);
  }

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
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(dateString));
    const date = dateOnly ? new Date(`${dateString}T00:00:00Z`) : new Date(dateString);
    const timeZone = dateOnly ? 'UTC' : businessTimeZone();
    return new Intl.DateTimeFormat('en-US', { ...options, timeZone }).format(date);
  }

  function clockTimeLabel(value) {
    if (!value) return '—';
    const [hour, minute] = value.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2,'0')} ${period}`;
  }

  function sessionTimeRangeLabel(session) {
    if (!session?.startTime || !session?.endTime) return '—';
    return `${clockTimeLabel(session.startTime)}–${clockTimeLabel(session.endTime)}`;
  }

  function timeToMinutes(value) {
    if (!value) return null;
    const [hour, minute] = value.split(':').map(Number);
    return hour * 60 + minute;
  }

  function minutesToTime(totalMinutes) {
    const normalized = ((Math.round(totalMinutes / 5) * 5) % 1440 + 1440) % 1440;
    return `${String(Math.floor(normalized / 60)).padStart(2,'0')}:${String(normalized % 60).padStart(2,'0')}`;
  }

  function currentRoundedTime() {
    const now = zonedNowParts();
    return minutesToTime(now.hour * 60 + now.minute);
  }

  function addMinutesToTime(value, amount) {
    const base = timeToMinutes(value);
    return minutesToTime((base ?? 0) + amount);
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

  function sessionInvoiceStatusLabel(session) {
    if (session.invoiceStatus === 'draft') return 'In draft';
    if (session.invoiceStatus === 'invoiced') return 'Invoiced';
    return 'Uninvoiced';
  }

  function sessionInvoiceStatusClass(session) {
    if (session.invoiceStatus === 'invoiced') return 'success';
    if (session.invoiceStatus === 'draft') return 'accent';
    return '';
  }

  function applyHomeAtriumState(viewName = ui.activeView) {
    const usesAtrium = viewName === 'home' || viewName === 'work';
    document.body.classList.toggle('home-atrium-active', usesAtrium);
    document.body.classList.toggle('work-atrium-active', viewName === 'work');
    homeAtriumScene?.setAttribute('aria-hidden', 'true');
    if (usesAtrium) applyAtriumRuntimeProfile();
    if (!usesAtrium) {
      document.documentElement.style.setProperty('--atrium-px', '0');
      document.documentElement.style.setProperty('--atrium-py', '0');
      document.documentElement.style.setProperty('--atrium-scroll', '0');
      document.documentElement.style.setProperty('--atrium-light-x', '52%');
      document.documentElement.style.setProperty('--atrium-light-y', '28%');
    }
  }

  function commitAtriumMotion() {
    atriumFrame = null;
    if (!['home','work'].includes(ui.activeView) || prefersReducedMotion.matches) return;
    const px = atriumMotionProfile === 'desktop' ? atriumPointerX : 0;
    const py = atriumMotionProfile === 'desktop' ? atriumPointerY : 0;
    document.documentElement.style.setProperty('--atrium-px', px.toFixed(4));
    document.documentElement.style.setProperty('--atrium-py', py.toFixed(4));
    document.documentElement.style.setProperty('--atrium-scroll', '0');
    document.documentElement.style.setProperty('--atrium-light-x', `${(50 + px * 14).toFixed(1)}%`);
    document.documentElement.style.setProperty('--atrium-light-y', `${(29 + py * 10).toFixed(1)}%`);
  }

  function queueAtriumMotion(clientX, clientY) {
    if (!['home','work'].includes(ui.activeView) || prefersReducedMotion.matches) return;
    if (atriumMotionProfile !== 'desktop') {
      atriumPointerX = 0;
      atriumPointerY = 0;
      if (!atriumFrame) atriumFrame = requestAnimationFrame(commitAtriumMotion);
      return;
    }
    if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
      atriumPointerX = Math.max(-1, Math.min(1, (clientX / Math.max(window.innerWidth,1) - .5) * 2));
      atriumPointerY = Math.max(-1, Math.min(1, (clientY / Math.max(window.innerHeight,1) - .5) * 2));
    }
    if (!atriumFrame) atriumFrame = requestAnimationFrame(commitAtriumMotion);
  }

  function applyAtriumRuntimeProfile() {
    const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    const iPadLike = /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const safariLike = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || iPadLike;
    const liteProfile = coarsePointer || safariLike || window.innerWidth <= 1180;
    document.documentElement.classList.toggle('atrium-touch', coarsePointer);
    document.documentElement.classList.toggle('atrium-safari', safariLike);
    document.documentElement.classList.toggle('atrium-lite', liteProfile);
    atriumMotionProfile = liteProfile ? 'static' : 'desktop';
    if (liteProfile) {
      atriumPointerX = 0;
      atriumPointerY = 0;
    }
    if (!atriumFrame) atriumFrame = requestAnimationFrame(commitAtriumMotion);
  }

  function setView(viewName) {
    ui.activeView = viewName;
    applyHomeAtriumState(viewName);
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
    if (modal === $('#invoiceSheet')) setTimeout(() => $('#invoiceClient')?.focus(), 60);
  }

  function closeModal(hideOverlay = true) {
    modals.forEach(item => { if (item) item.hidden = true; });
    resetDetailPanelTheme();
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
    const monthKey = businessMonthKey();
    const monthly = sessions.filter(s => s.date?.slice(0,7) === monthKey);
    const totalMinutes = monthly.reduce((sum, s) => sum + sessionMinutes(s), 0);
    const uninvoiced = sessions.filter(s => s.invoiceStatus === 'uninvoiced');
    const uninvoicedCents = uninvoiced.reduce((sum, s) => sum + sessionAmountCents(s), 0);
    const invoiceEarningsCents = businessPayments()
      .filter(payment => payment.kind === 'invoice')
      .reduce((sum, payment) => sum + Number(payment.amountCents || 0), 0);

    $('#metricClients').textContent = clients.length;
    $('#metricHours').textContent = `${(totalMinutes / 60).toFixed(totalMinutes % 60 ? 1 : 0)}h`;
    $('#metricUninvoiced').textContent = formatMoney(uninvoicedCents, activeBusiness().currency);
    $('#metricInvoiceEarnings').textContent = formatMoney(invoiceEarningsCents, activeBusiness().currency);
    $('#clientTabCount').textContent = businessClients().length;
    $('#sessionTabCount').textContent = sessions.length;

    const incomplete = sessions.filter(s => !s.clientId || !s.date || !s.startTime || !s.endTime);
    const overdue = businessInvoices().filter(invoice => invoiceDisplayStatus(invoice) === 'Overdue');
    const expenseReview = businessExpenses().filter(expense => expense.reviewStatus === 'needs_review');
    const attentionItems = [
      ...overdue.map(invoice => ({ type: 'invoice', id: invoice.id, title: `${invoice.number} is overdue`, sub: `${invoice.recipientSnapshot?.displayName || 'Client'} · ${formatMoney(invoiceBalanceCents(invoice), activeBusiness().currency)} still due` })),
      ...expenseReview.map(expense => ({ type: 'expense', id: expense.id, title: `${expense.merchant || 'Expense'} needs review`, sub: `${formatMoney(expense.totalCents || 0, activeBusiness().currency)} · ${expenseCategoryLabel(expense.category)} · ${formatDate(expense.date,{month:'short',day:'numeric'})}` })),
      ...incomplete.map(session => ({ type: 'session', id: session.id, title: 'Incomplete work session', sub: `${clientById(session.clientId)?.displayName || session.clientNameSnapshot || 'No client'} · ${formatDate(session.date)}` }))
    ];
    $('#attentionCount').textContent = `${attentionItems.length} ${attentionItems.length === 1 ? 'item' : 'items'}`;
    $('#attentionTitle').textContent = attentionItems.length ? 'A few records need review.' : 'Nothing needs your attention.';
    $('#attentionBody').innerHTML = attentionItems.length
      ? `<div class="attention-list">${attentionItems.slice(0,3).map(item => `<button ${item.type === 'invoice' ? `data-invoice-detail="${item.id}"` : item.type === 'expense' ? `data-expense-detail="${item.id}"` : `data-session-detail="${item.id}"`}><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.sub)}</small></button>`).join('')}</div>`
      : `<p class="panel-copy">Overdue invoices, incomplete work sessions, and expenses you mark for review will collect here.</p>`;

    renderRandomHomeSessions(sessions, false);
    startHomeRecentRotation();

    $$('[data-session-detail]', $('#attentionBody')).forEach(btn => btn.addEventListener('click', () => openSessionDetail(btn.dataset.sessionDetail)));
    $$('[data-invoice-detail]', $('#attentionBody')).forEach(btn => btn.addEventListener('click', () => openInvoiceDetail(btn.dataset.invoiceDetail)));
    $$('[data-expense-detail]', $('#attentionBody')).forEach(btn => btn.addEventListener('click', () => { setView('money'); ui.moneyTab='expenses'; syncMoneyTabs(); openExpenseDetail(btn.dataset.expenseDetail); }));
  }

  function randomSample(items, count) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(count, copy.length));
  }

  function bindHomeRecentSessionClicks() {
    $$('[data-session-detail]', $('#recentSessions')).forEach(btn => btn.addEventListener('click', () => openSessionDetail(btn.dataset.sessionDetail)));
  }

  function pickHomeRecentSessions(sessions) {
    // Keep the card genuinely "recent" while randomizing what appears and in what order.
    const pool = sessions.slice().sort((a,b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)).slice(0,12);
    if (pool.length <= 4) return randomSample(pool, 4);
    let chosen = randomSample(pool, 4);
    let signature = chosen.map(item => item.id).sort().join('|');
    for (let attempts = 0; attempts < 5 && signature === homeRecentSignature; attempts += 1) {
      chosen = randomSample(pool, 4);
      signature = chosen.map(item => item.id).sort().join('|');
    }
    return chosen;
  }

  function renderRandomHomeSessions(sessions = businessSessions(), animate = true) {
    const host = $('#recentSessions');
    if (!host) return;
    if (!sessions.length) {
      homeRecentSignature = '';
      host.dataset.transitioning = 'false';
      host.classList.remove('is-crossfading');
      host.style.height = '';
      host.innerHTML = `<div class="inline-empty"><strong>No sessions yet</strong><small>Add your first work session and it will appear here.</small></div>`;
      return;
    }

    const chosen = pickHomeRecentSessions(sessions);
    const nextSignature = chosen.map(item => item.id).sort().join('|');
    const incomingHtml = chosen.map(sessionRowCompact).join('');
    const commit = () => {
      host.dataset.transitioning = 'false';
      host.classList.remove('is-crossfading');
      host.style.height = '';
      host.innerHTML = incomingHtml;
      homeRecentSignature = nextSignature;
      bindHomeRecentSessionClicks();
    };

    clearTimeout(homeRecentSwapTimer);
    if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit();
      return;
    }
    if (host.dataset.transitioning === 'true') return;

    const outgoingHtml = host.innerHTML;
    const currentHeight = Math.max(host.getBoundingClientRect().height, 1);
    host.dataset.transitioning = 'true';
    host.classList.add('is-crossfading');
    host.style.height = `${currentHeight}px`;
    host.innerHTML = `
      <div class="recent-transition-layer recent-transition-outgoing">${outgoingHtml}</div>
      <div class="recent-transition-layer recent-transition-incoming">${incomingHtml}</div>`;

    const outgoingRows = $$('.recent-transition-outgoing .recent-row', host);
    const incomingRows = $$('.recent-transition-incoming .recent-row', host);
    outgoingRows.forEach((row, index) => row.style.setProperty('--recent-stagger', `${index * 110}ms`));
    incomingRows.forEach((row, index) => row.style.setProperty('--recent-stagger', `${index * 120}ms`));

    // Keep both sets alive during the transition so this is a true dissolve/crossfade,
    // not an opacity fade followed by an abrupt DOM replacement.
    homeRecentSwapTimer = setTimeout(commit, 2550);
  }

  function startHomeRecentRotation() {
    clearInterval(homeRecentRotationTimer);
    homeRecentRotationTimer = setInterval(() => {
      if (ui.activeView !== 'home' || document.hidden || ui.modal) return;
      const recentHost = $('#recentSessions');
      if (recentHost?.matches(':hover') || recentHost?.contains(document.activeElement)) return;
      if (businessSessions().length < 2) return;
      renderRandomHomeSessions(businessSessions(), true);
    }, 9000);
  }

  function sessionRowCompact(s) {
    const client = clientById(s.clientId);
    return `<button class="recent-row" data-session-detail="${s.id}"><span class="recent-date"><strong>${formatDate(s.date,{month:'short'})}</strong><small>${formatDate(s.date,{day:'numeric'})}</small></span><span class="recent-main"><strong>${escapeHtml(client?.displayName || s.clientNameSnapshot || 'Unassigned')}</strong><small>${escapeHtml(sessionTimeRangeLabel(s))} · ${hoursLabel(sessionMinutes(s))}</small></span><span class="recent-amount">${formatMoney(sessionAmountCents(s), activeBusiness().currency)}</span></button>`;
  }

  function renderSessions() {
    const term = ($('#sessionSearch')?.value || '').toLowerCase().trim();
    const sessionFilterLabels = { all:'All sessions', uninvoiced:'Uninvoiced', linked:'In invoice' };
    $('#sessionFilterBtn').textContent = sessionFilterLabels[ui.sessionFilter] || 'All sessions';
    const sessions = businessSessions().slice().sort((a,b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)).filter(s => {
      const client = clientById(s.clientId);
      const matchesTerm = !term || `${client?.displayName || s.clientNameSnapshot || ''} ${s.date || ''} ${s.notes || ''}`.toLowerCase().includes(term);
      const matchesFilter = ui.sessionFilter === 'all' || (ui.sessionFilter === 'uninvoiced' ? s.invoiceStatus === 'uninvoiced' : s.invoiceStatus !== 'uninvoiced');
      return matchesTerm && matchesFilter;
    });

    const pageSize = ui.sessionPageSize || 7;
    const totalPages = Math.max(1, Math.ceil(sessions.length / pageSize));
    ui.sessionPage = Math.min(Math.max(1, ui.sessionPage || 1), totalPages);
    const pageStart = (ui.sessionPage - 1) * pageSize;
    const pageSessions = sessions.slice(pageStart, pageStart + pageSize);
    const pagination = sessions.length > pageSize ? `
      <div class="session-pagination" aria-label="Session pages">
        <button type="button" class="pagination-arrow" data-session-page-prev aria-label="Previous session page" ${ui.sessionPage === 1 ? 'disabled' : ''}>←</button>
        <span class="pagination-copy"><strong>Page ${ui.sessionPage}</strong><small>of ${totalPages} · ${sessions.length} sessions</small></span>
        <button type="button" class="pagination-arrow" data-session-page-next aria-label="Next session page" ${ui.sessionPage === totalPages ? 'disabled' : ''}>→</button>
      </div>` : '';

    $('#sessionsContainer').innerHTML = sessions.length ? `
      <div class="table-head session-grid"><span>Client</span><span>Date</span><span>Time</span><span>Value</span><span>Status</span></div>
      ${pageSessions.map(s => {
        const client = clientById(s.clientId);
        return `<button class="table-row session-grid" data-session-detail="${s.id}"><span><strong class="client-session-name ${clientColorClass(client)}">${escapeHtml(client?.displayName || 'Unassigned')}</strong><small>${escapeHtml(s.notes || 'No session note')}</small></span><span><strong>${formatDate(s.date,{month:'short',day:'numeric'})}</strong><small>${formatDate(s.date,{weekday:'short'})}</small></span><span><strong>${escapeHtml(sessionTimeRangeLabel(s))}</strong><small>${hoursLabel(sessionMinutes(s))}</small></span><span><strong>${formatMoney(sessionAmountCents(s), activeBusiness().currency)}</strong><small>@ ${formatMoney(s.rateCents || 0)}/hr</small></span><span><span class="status-pill ${sessionInvoiceStatusClass(s)}">${sessionInvoiceStatusLabel(s)}</span></span></button>`;
      }).join('')}${pagination}` : emptyState('No work sessions yet', 'Log completed work here. Later, this same record will flow into invoices and mileage.', 'Add work session', 'add-session');

    $$('[data-session-detail]', $('#sessionsContainer')).forEach(btn => btn.addEventListener('click', () => openSessionDetail(btn.dataset.sessionDetail)));
    $('[data-session-page-prev]', $('#sessionsContainer'))?.addEventListener('click', () => {
      if (ui.sessionPage > 1) { ui.sessionPage -= 1; renderSessions(); }
    });
    $('[data-session-page-next]', $('#sessionsContainer'))?.addEventListener('click', () => {
      if (ui.sessionPage < totalPages) { ui.sessionPage += 1; renderSessions(); }
    });

    if (sessions.length > pageSize) {
      const host = $('#sessionsContainer');
      let touchStartX = null;
      let touchStartY = null;
      host.addEventListener('touchstart', event => {
        const touch = event.changedTouches?.[0];
        if (!touch) return;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }, { passive:true });
      host.addEventListener('touchend', event => {
        const touch = event.changedTouches?.[0];
        if (!touch || touchStartX === null || touchStartY === null) return;
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        touchStartX = touchStartY = null;
        if (Math.abs(dx) < 60 || Math.abs(dx) <= Math.abs(dy) * 1.15) return;
        if (dx < 0 && ui.sessionPage < totalPages) { ui.sessionPage += 1; renderSessions(); }
        if (dx > 0 && ui.sessionPage > 1) { ui.sessionPage -= 1; renderSessions(); }
      }, { passive:true });
    }
    bindEmptyActions();
  }

  function renderClients() {
    const term = ($('#clientSearch')?.value || '').toLowerCase().trim();
    const clientFilterLabels = { all:'All clients', active:'Active', inactive:'Inactive' };
    $('#clientFilterBtn').textContent = clientFilterLabels[ui.clientFilter] || 'Active';
    const clients = businessClients().filter(c => {
      const matchesTerm = !term || `${c.displayName} ${c.notes || ''}`.toLowerCase().includes(term);
      const matchesFilter = ui.clientFilter === 'all' || c.status === ui.clientFilter;
      return matchesTerm && matchesFilter;
    });
    $('#clientsContainer').innerHTML = clients.length ? clients.map(c => {
      const sessions = businessSessions().filter(s => s.clientId === c.id);
      const minutes = sessions.reduce((sum,s) => sum + sessionMinutes(s), 0);
      return `<button class="client-card" data-client-detail="${c.id}"><div class="client-top"><span class="client-avatar client-avatar-color client-bg-${clientColorKey(c)}">${escapeHtml(initials(c.displayName))}</span><span class="status-pill ${c.status === 'active' ? 'success' : ''}">${escapeHtml(c.status)}</span></div><strong>${escapeHtml(c.displayName)}</strong><small>${escapeHtml(c.notes || 'No notes yet')}</small><div class="client-meta"><span><b>${formatMoney(c.defaultRateCents || 0)}</b><small>/hr default</small></span><span><b>${sessions.length}</b><small>sessions</small></span><span><b>${hoursLabel(minutes)}</b><small>logged</small></span></div></button>`;
    }).join('') : emptyState(businessClients().length ? 'No clients match this filter' : 'No clients yet', businessClients().length ? 'Choose another client status to see the rest.' : 'Add the people or organizations you do work for. Names can be aliases if you prefer.', businessClients().length ? 'Show all clients' : 'Add first client', businessClients().length ? 'all-clients' : 'add-client');
    $$('[data-client-detail]').forEach(btn => btn.addEventListener('click', () => openClientDetail(btn.dataset.clientDetail)));
    bindEmptyActions();
  }

  function emptyState(title, copy, actionLabel, action) {
    return `<div class="large-empty"><div class="placeholder-icon small">＋</div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p><button class="secondary-btn" data-empty-action="${action}">${escapeHtml(actionLabel)}</button></div>`;
  }

  function bindEmptyActions() {
    $$('[data-empty-action]').forEach(btn => btn.addEventListener('click', () => {
      if (btn.dataset.emptyAction === 'add-client') { openClientForm(); return; }
      if (btn.dataset.emptyAction === 'add-session') { openSessionForm(); return; }
      if (btn.dataset.emptyAction === 'all-clients') { ui.clientFilter = 'all'; renderClients(); }
    }));
  }

  function renderWork() { renderSessions(); renderClients(); }

  function invoiceStatusClass(invoice) {
    const status = invoiceDisplayStatus(invoice).toLowerCase();
    if (status === 'paid') return 'success';
    if (status === 'partially paid') return 'accent';
    if (status === 'overdue') return 'danger';
    if (status === 'draft') return 'accent';
    if (status === 'sent') return 'sent';
    if (status === 'void') return 'void';
    return '';
  }

  function paymentKindLabel(payment) {
    return payment.kind === 'invoice' ? 'Invoice payment' : 'Other income';
  }

  function paymentMethodLabel(method) {
    return ({ cash:'Cash', check:'Check', zelle:'Zelle', venmo:'Venmo', ach:'ACH', direct_deposit:'Direct deposit', card:'Card', other:'Other' })[method] || 'Other';
  }

  function expenseCategoryLabel(category) { return Object.fromEntries(EXPENSE_CATEGORIES)[category] || 'Other'; }
  function expenseClassLabel(value) { return ({ business:'Business', mixed:'Mixed', personal:'Personal' })[value] || 'Business'; }
  function expenseClassStatus(value) { return value === 'business' ? 'success' : value === 'mixed' ? 'accent' : 'void'; }
  function fileSizeLabel(bytes = 0) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`; return `${(bytes/1024/1024).toFixed(1)} MB`; }

  function renderMoney() {
    const invoices = businessInvoices().slice().sort((a,b) => `${b.issueDate || ''}${b.createdAt || ''}`.localeCompare(`${a.issueDate || ''}${a.createdAt || ''}`));
    const payments = businessPayments().slice().sort((a,b) => `${b.receivedDate || ''}${b.createdAt || ''}`.localeCompare(`${a.receivedDate || ''}${a.createdAt || ''}`));
    const expenses = businessExpenses().slice().sort((a,b) => `${b.date || ''}${b.createdAt || ''}`.localeCompare(`${a.date || ''}${a.createdAt || ''}`));
    const visibleInvoices = invoices.filter(invoice => ui.invoiceFilter === 'all' || invoiceDisplayStatus(invoice).toLowerCase().replace(/ /g,'_') === ui.invoiceFilter);
    const visiblePayments = payments.filter(payment => ui.paymentFilter === 'all' || payment.kind === ui.paymentFilter);
    const visibleExpenses = expenses.filter(expense => ui.expenseFilter === 'all' || (ui.expenseFilter === 'needs_review' ? expense.reviewStatus === 'needs_review' : expense.classification === ui.expenseFilter));
    const sentInvoices = invoices.filter(invoice => invoice.status === 'sent');
    const receivedTotal = payments.reduce((sum, payment) => sum + Number(payment.amountCents || 0), 0);
    const outstandingTotal = sentInvoices.reduce((sum, invoice) => sum + invoiceBalanceCents(invoice), 0);
    const overdueCount = invoices.filter(invoice => invoiceDisplayStatus(invoice) === 'Overdue').length;

    $('#moneyReceivedTotal').textContent = formatMoney(receivedTotal, activeBusiness().currency);
    $('#moneyOutstandingTotal').textContent = formatMoney(outstandingTotal, activeBusiness().currency);
    $('#moneyOverdueCount').textContent = overdueCount;
    $('#invoiceCount').textContent = invoices.length;
    $('#paymentCount').textContent = payments.length;
    $('#expenseCount').textContent = expenses.length;
    const invoiceFilterLabels = { all:'All invoices', draft:'Draft', sent:'Sent', partially_paid:'Partially paid', paid:'Paid', overdue:'Overdue', void:'Void' };
    $('#invoiceFilterBtn').textContent = invoiceFilterLabels[ui.invoiceFilter] || 'All invoices';
    const paymentFilterLabels = { all:'All payments', invoice:'Invoice payments', direct:'Other income' };
    $('#paymentFilterBtn').textContent = paymentFilterLabels[ui.paymentFilter] || 'All payments';
    const expenseFilterLabels = { all:'All expenses', business:'Business', mixed:'Mixed', personal:'Personal', needs_review:'Needs review' };
    $('#expenseFilterBtn').textContent = expenseFilterLabels[ui.expenseFilter] || 'All expenses';
    const monthExpenses = expenses.filter(expense => expense.date?.slice(0,7) === businessMonthKey());
    $('#expenseMonthTotal').textContent = `${formatMoney(monthExpenses.reduce((sum, expense) => sum + Number(expense.totalCents || 0), 0), activeBusiness().currency)} this month`;
    $('#expenseBusinessTotal').textContent = `${formatMoney(monthExpenses.reduce((sum, expense) => sum + Number(expense.businessCents || 0), 0), activeBusiness().currency)} business portion`;

    const invoicePageSize = ui.invoicePageSize || 7;
    const invoiceTotalPages = Math.max(1, Math.ceil(visibleInvoices.length / invoicePageSize));
    ui.invoicePage = Math.min(Math.max(1, ui.invoicePage || 1), invoiceTotalPages);
    const invoiceStart = (ui.invoicePage - 1) * invoicePageSize;
    const invoicePageRecords = visibleInvoices.slice(invoiceStart, invoiceStart + invoicePageSize);
    const invoicePagination = visibleInvoices.length > invoicePageSize ? `
      <div class="session-pagination" aria-label="Invoice pages">
        <button type="button" class="pagination-arrow" data-invoice-page-prev aria-label="Previous invoice page" ${ui.invoicePage === 1 ? 'disabled' : ''}>←</button>
        <span class="pagination-copy"><strong>Page ${ui.invoicePage}</strong><small>of ${invoiceTotalPages} · ${visibleInvoices.length} invoices</small></span>
        <button type="button" class="pagination-arrow" data-invoice-page-next aria-label="Next invoice page" ${ui.invoicePage === invoiceTotalPages ? 'disabled' : ''}>→</button>
      </div>` : '';

    const paymentPageSize = ui.paymentPageSize || 7;
    const paymentTotalPages = Math.max(1, Math.ceil(visiblePayments.length / paymentPageSize));
    ui.paymentPage = Math.min(Math.max(1, ui.paymentPage || 1), paymentTotalPages);
    const paymentStart = (ui.paymentPage - 1) * paymentPageSize;
    const paymentPageRecords = visiblePayments.slice(paymentStart, paymentStart + paymentPageSize);
    const paymentPagination = visiblePayments.length > paymentPageSize ? `
      <div class="session-pagination" aria-label="Payment pages">
        <button type="button" class="pagination-arrow" data-payment-page-prev aria-label="Previous payment page" ${ui.paymentPage === 1 ? 'disabled' : ''}>←</button>
        <span class="pagination-copy"><strong>Page ${ui.paymentPage}</strong><small>of ${paymentTotalPages} · ${visiblePayments.length} payments</small></span>
        <button type="button" class="pagination-arrow" data-payment-page-next aria-label="Next payment page" ${ui.paymentPage === paymentTotalPages ? 'disabled' : ''}>→</button>
      </div>` : '';

    const expensePageSize = ui.expensePageSize || 7;
    const expenseTotalPages = Math.max(1, Math.ceil(visibleExpenses.length / expensePageSize));
    ui.expensePage = Math.min(Math.max(1, ui.expensePage || 1), expenseTotalPages);
    const expenseStart = (ui.expensePage - 1) * expensePageSize;
    const expensePageRecords = visibleExpenses.slice(expenseStart, expenseStart + expensePageSize);
    const expensePagination = visibleExpenses.length > expensePageSize ? `
      <div class="session-pagination" aria-label="Expense pages">
        <button type="button" class="pagination-arrow" data-expense-page-prev aria-label="Previous expense page" ${ui.expensePage === 1 ? 'disabled' : ''}>←</button>
        <span class="pagination-copy"><strong>Page ${ui.expensePage}</strong><small>of ${expenseTotalPages} · ${visibleExpenses.length} expenses</small></span>
        <button type="button" class="pagination-arrow" data-expense-page-next aria-label="Next expense page" ${ui.expensePage === expenseTotalPages ? 'disabled' : ''}>→</button>
      </div>` : '';

    $('#invoicesContainer').innerHTML = visibleInvoices.length ? `
      <div class="table-head invoice-grid"><span>Invoice</span><span>Client</span><span>Issued</span><span>Due</span><span>Balance</span><span>Status</span></div>
      ${invoicePageRecords.map(invoice => {
        const paid = invoicePaidCents(invoice);
        const balance = invoice.status === 'void' ? 0 : invoiceBalanceCents(invoice);
        const total = invoiceTotalCents(invoice);
        const paymentNote = invoice.status === 'void' ? 'Voided' : paid ? `${formatMoney(paid, activeBusiness().currency)} paid of ${formatMoney(total, activeBusiness().currency)}` : `${formatMoney(total, activeBusiness().currency)} total`;
        return `<button class="table-row invoice-grid" data-invoice-detail="${invoice.id}"><span><strong>${escapeHtml(invoice.number)}</strong><small>${(invoice.lineItems || []).length} ${(invoice.lineItems || []).length === 1 ? 'item' : 'items'}</small></span><span><strong>${escapeHtml(invoice.recipientSnapshot?.displayName || clientById(invoice.clientId)?.displayName || 'Client')}</strong><small>${escapeHtml(invoice.recipientSnapshot?.billingEmail || 'No billing email')}</small></span><span><strong>${formatDate(invoice.issueDate,{month:'short',day:'numeric'})}</strong><small>${formatDate(invoice.issueDate,{year:'numeric'})}</small></span><span><strong>${formatDate(invoice.dueDate,{month:'short',day:'numeric'})}</strong><small>${invoice.dueDate ? formatDate(invoice.dueDate,{weekday:'short'}) : '—'}</small></span><span><strong>${formatMoney(balance, activeBusiness().currency)}</strong><small>${escapeHtml(paymentNote)}</small></span><span><span class="status-pill ${invoiceStatusClass(invoice)}">${escapeHtml(invoiceDisplayStatus(invoice))}</span></span></button>`;
      }).join('')}${invoicePagination}`
      : emptyState(invoices.length ? 'No invoices match this filter' : 'No invoices yet', invoices.length ? 'Choose another invoice status to see the rest.' : 'Turn completed work into a clean invoice without entering the hours twice.', invoices.length ? 'Show all invoices' : 'Create first invoice', invoices.length ? 'all-invoices' : 'add-invoice');

    $('#paymentsContainer').innerHTML = visiblePayments.length ? `
      <div class="table-head payment-grid"><span>Source</span><span>Received</span><span>Type</span><span>Method</span><span>Amount</span></div>
      ${paymentPageRecords.map(payment => {
        const invoice = payment.invoiceId ? invoiceById(payment.invoiceId) : null;
        const sourcePrimary = payment.kind === 'invoice' ? (payment.invoiceNumberSnapshot || invoice?.number || 'Invoice') : (payment.sourceName || payment.clientNameSnapshot || 'Other income');
        const sourceSecondary = payment.kind === 'invoice' ? (payment.clientNameSnapshot || invoice?.recipientSnapshot?.displayName || 'Client') : (payment.description || 'Direct income');
        return `<button class="table-row payment-grid" data-payment-detail="${payment.id}"><span><strong>${escapeHtml(sourcePrimary)}</strong><small>${escapeHtml(sourceSecondary)}</small></span><span><strong>${formatDate(payment.receivedDate,{month:'short',day:'numeric'})}</strong><small>${formatDate(payment.receivedDate,{year:'numeric'})}</small></span><span><span class="status-pill ${payment.kind === 'invoice' ? 'accent' : 'success'}">${escapeHtml(paymentKindLabel(payment))}</span></span><span><strong>${escapeHtml(paymentMethodLabel(payment.method))}</strong><small>${escapeHtml(payment.reference || 'No reference')}</small></span><span><strong>${formatMoney(payment.amountCents || 0, activeBusiness().currency)}</strong><small>Received</small></span></button>`;
      }).join('')}${paymentPagination}`
      : emptyState(payments.length ? 'No payments match this filter' : 'No payments recorded yet', payments.length ? 'Choose another payment type to see the rest.' : 'Record actual money received. Link it to an invoice or capture income that did not require one.', payments.length ? 'Show all payments' : 'Record first payment', payments.length ? 'all-payments' : 'add-payment');


    $('#expensesContainer').innerHTML = visibleExpenses.length ? `
      <div class="table-head expense-grid"><span>Merchant / expense</span><span>Date</span><span>Category</span><span>Use</span><span>Receipt</span><span>Amount</span></div>
      ${expensePageRecords.map(expense => {
        const receipt = expense.receiptId ? receiptById(expense.receiptId) : null;
        const client = expense.clientId ? clientById(expense.clientId) : null;
        const secondary = expense.description || expense.businessPurpose || client?.displayName || 'No description';
        return `<button class="table-row expense-grid" data-expense-detail="${expense.id}"><span><strong>${escapeHtml(expense.merchant || 'Expense')}</strong><small>${escapeHtml(secondary)}</small></span><span><strong>${formatDate(expense.date,{month:'short',day:'numeric'})}</strong><small>${formatDate(expense.date,{year:'numeric'})}</small></span><span><strong>${escapeHtml(expenseCategoryLabel(expense.category))}</strong><small>${expense.reviewStatus === 'needs_review' ? '<span class="review-inline">Needs review</span>' : 'Recorded'}</small></span><span><span class="status-pill ${expenseClassStatus(expense.classification)}">${escapeHtml(expenseClassLabel(expense.classification))}</span></span><span><span class="receipt-mini ${receipt ? 'has-receipt' : ''}">${receipt ? '▧ Receipt' : '—'}</span></span><span><strong>${formatMoney(expense.totalCents || 0, activeBusiness().currency)}</strong><small>${expense.classification === 'personal' ? 'Personal' : `${formatMoney(expense.businessCents || 0, activeBusiness().currency)} business`}</small></span></button>`;
      }).join('')}${expensePagination}`
      : emptyState(expenses.length ? 'No expenses match this filter' : 'No expenses yet', expenses.length ? 'Choose another classification or review state.' : 'Capture money spent once and attach the receipt or business purpose while it is still fresh.', expenses.length ? 'Show all expenses' : 'Add first expense', expenses.length ? 'all-expenses' : 'add-expense');

    $$('[data-invoice-detail]', $('#invoicesContainer')).forEach(btn => btn.addEventListener('click', () => openInvoiceDetail(btn.dataset.invoiceDetail)));
    $$('[data-payment-detail]', $('#paymentsContainer')).forEach(btn => btn.addEventListener('click', () => openPaymentDetail(btn.dataset.paymentDetail)));
    $$('[data-expense-detail]', $('#expensesContainer')).forEach(btn => btn.addEventListener('click', () => openExpenseDetail(btn.dataset.expenseDetail)));
    $('[data-invoice-page-prev]', $('#invoicesContainer'))?.addEventListener('click', () => {
      if (ui.invoicePage > 1) { ui.invoicePage -= 1; renderMoney(); }
    });
    $('[data-invoice-page-next]', $('#invoicesContainer'))?.addEventListener('click', () => {
      if (ui.invoicePage < invoiceTotalPages) { ui.invoicePage += 1; renderMoney(); }
    });
    $('[data-payment-page-prev]', $('#paymentsContainer'))?.addEventListener('click', () => {
      if (ui.paymentPage > 1) { ui.paymentPage -= 1; renderMoney(); }
    });
    $('[data-payment-page-next]', $('#paymentsContainer'))?.addEventListener('click', () => {
      if (ui.paymentPage < paymentTotalPages) { ui.paymentPage += 1; renderMoney(); }
    });
    $('[data-expense-page-prev]', $('#expensesContainer'))?.addEventListener('click', () => { if (ui.expensePage > 1) { ui.expensePage -= 1; renderMoney(); } });
    $('[data-expense-page-next]', $('#expensesContainer'))?.addEventListener('click', () => { if (ui.expensePage < expenseTotalPages) { ui.expensePage += 1; renderMoney(); } });
    bindMoneyEmptyActions();
  }

  function bindMoneyEmptyActions() {
    $$('[data-empty-action="add-invoice"]').forEach(btn => btn.addEventListener('click', () => openInvoiceForm()));
    $$('[data-empty-action="all-invoices"]').forEach(btn => btn.addEventListener('click', () => { ui.invoiceFilter = 'all'; ui.invoicePage = 1; renderMoney(); }));
    $$('[data-empty-action="add-payment"]').forEach(btn => btn.addEventListener('click', () => openPaymentForm()));
    $$('[data-empty-action="all-payments"]').forEach(btn => btn.addEventListener('click', () => { ui.paymentFilter = 'all'; ui.paymentPage = 1; renderMoney(); }));
    $$('[data-empty-action="add-expense"]').forEach(btn => btn.addEventListener('click', () => openExpenseForm()));
    $$('[data-empty-action="all-expenses"]').forEach(btn => btn.addEventListener('click', () => { ui.expenseFilter = 'all'; ui.expensePage = 1; renderMoney(); }));
  }

  function syncMoneyTabs() {
    $$('[data-money-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.moneyTab === ui.moneyTab));
    $$('[data-money-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.moneyPanel === ui.moneyTab));
  }

  function invoiceSessionDescription(session) {
    return `Work session · ${formatDate(session.date,{month:'short',day:'numeric',year:'numeric'})} · ${sessionTimeRangeLabel(session)}`;
  }

  function invoiceSessionLine(session, existingLineId = null) {
    return {
      id: existingLineId || uid('line'),
      type: 'session',
      sessionId: session.id,
      description: invoiceSessionDescription(session),
      quantityMinutes: sessionMinutes(session),
      rateCents: session.rateCents || 0,
      amountCents: sessionAmountCents(session)
    };
  }

  function openInvoiceForm({ existingId = null, clientId = null, sessionId = null } = {}) {
    const clients = businessClients().filter(client => client.status === 'active' || client.id === clientId || client.id === invoiceById(existingId)?.clientId);
    if (!clients.length) {
      showToast('Add a client before creating an invoice.');
      openClientForm();
      return;
    }
    const existing = existingId ? invoiceById(existingId) : null;
    if (existing?.status === 'void') { showToast('Voided invoices are preserved as read-only records.'); return; }
    if (existing && invoicePayments(existing).length) { showToast('Correct or delete linked payments before editing this invoice.'); return; }
    ui.invoiceFormId = existingId;
    const selectedClientId = existing?.clientId || clientId || (sessionId ? data.sessions.find(s => s.id === sessionId)?.clientId : '') || (clients.length === 1 ? clients[0].id : '');
    const today = businessToday();
    const issueDate = existing?.issueDate || today;
    const dueDate = existing?.dueDate || addDays(issueDate, activeBusiness().invoiceSettings?.defaultDueDays ?? 7);
    const selectedSessionIds = new Set((existing?.lineItems || []).filter(item => item.type === 'session').map(item => item.sessionId));
    if (sessionId) selectedSessionIds.add(sessionId);

    $('#invoiceEyebrow').textContent = existing ? 'EDIT INVOICE' : 'NEW INVOICE';
    $('#invoiceTitle').textContent = existing ? existing.number : 'Create invoice';
    $('#invoiceNumberHint').textContent = existing ? existing.number : `Next number · ${invoiceNumberPreview()}`;
    $('#invoiceSubmitBtn').textContent = existing ? 'Save changes' : 'Save draft';
    $('#invoiceClient').innerHTML = `<option value="">Choose client</option>${clients.map(client => `<option value="${client.id}" ${client.id === selectedClientId ? 'selected' : ''}>${escapeHtml(client.displayName)}</option>`).join('')}`;
    $('#invoiceIssueDate').value = issueDate;
    $('#invoiceDueDate').value = dueDate;
    $('#invoiceNote').value = existing?.note || '';
    $('#invoiceManualItems').innerHTML = '';
    (existing?.lineItems || []).filter(item => item.type === 'manual').forEach(item => addManualInvoiceRow(item));
    $('#invoiceSheet').dataset.selectedSessions = JSON.stringify([...selectedSessionIds]);
    renderInvoiceSessionChoices(selectedClientId, selectedSessionIds);
    updateInvoiceDraftTotal();
    openModal($('#invoiceSheet'));
  }

  function updateInvoiceSelectionActions() {
    const inputs = $$('input[name="invoiceSession"]', $('#invoiceSessionChoices'));
    const selectedCount = inputs.filter(input => input.checked).length;
    const selectAllBtn = $('#selectAllInvoiceSessions');
    const clearBtn = $('#clearInvoiceSessions');
    if (selectAllBtn) selectAllBtn.disabled = !inputs.length || selectedCount === inputs.length;
    if (clearBtn) clearBtn.disabled = selectedCount === 0;
  }

  function renderInvoiceSessionChoices(clientId, selected = new Set()) {
    const existing = ui.invoiceFormId ? invoiceById(ui.invoiceFormId) : null;
    const sessions = businessSessions().filter(session => session.clientId === clientId && (session.invoiceStatus === 'uninvoiced' || session.invoiceId === existing?.id)).sort((a,b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
    const host = $('#invoiceSessionChoices');
    if (!clientId) {
      host.innerHTML = `<div class="inline-empty invoice-empty"><small>Choose a client to see uninvoiced work.</small></div>`;
      updateInvoiceSelectionActions();
      return;
    }
    if (!sessions.length) {
      host.innerHTML = `<div class="inline-empty invoice-empty"><strong>No uninvoiced sessions</strong><small>You can still add a custom line item below.</small></div>`;
      updateInvoiceSelectionActions();
      return;
    }
    host.innerHTML = sessions.map(session => `<label class="invoice-session-option"><input type="checkbox" name="invoiceSession" value="${session.id}" ${selected.has(session.id) ? 'checked' : ''}/><span class="invoice-check">✓</span><span class="invoice-session-date"><strong>${formatDate(session.date,{month:'short',day:'numeric'})}</strong><small>${formatDate(session.date,{weekday:'short'})}</small></span><span class="invoice-session-main"><strong>${escapeHtml(sessionTimeRangeLabel(session))}</strong><small>${hoursLabel(sessionMinutes(session))} · ${session.notes ? escapeHtml(session.notes) : 'Work session'}</small></span><strong class="invoice-session-amount">${formatMoney(sessionAmountCents(session), activeBusiness().currency)}</strong></label>`).join('');
    $$('input[name="invoiceSession"]', host).forEach(input => input.addEventListener('change', () => { updateInvoiceDraftTotal(); updateInvoiceSelectionActions(); }));
    updateInvoiceSelectionActions();
  }

  function addManualInvoiceRow(item = {}) {
    const row = document.createElement('div');
    row.className = 'manual-line-row';
    row.dataset.lineId = item.id || uid('line');
    const quantity = item.quantity ?? 1;
    row.innerHTML = `<label><span>Description</span><input class="manual-description" maxlength="180" placeholder="Service, reimbursement, or flat-rate item" value="${escapeHtml(item.description || '')}" /></label><label class="manual-qty"><span>Qty</span><input class="manual-quantity" type="number" min="0.01" step="any" inputmode="decimal" value="${escapeHtml(quantity)}" /></label><label class="manual-rate"><span>Rate</span><div class="money-input compact"><span>$</span><input class="manual-rate-input" type="number" min="0" step="0.01" inputmode="decimal" value="${item.rateCents != null ? (item.rateCents/100).toFixed(2) : ''}" placeholder="0.00" /></div></label><button type="button" class="line-remove" aria-label="Remove line item">×</button>`;
    $('#invoiceManualItems').appendChild(row);
    $$('input', row).forEach(input => input.addEventListener('input', updateInvoiceDraftTotal));
    $('.line-remove', row).addEventListener('click', () => { row.remove(); updateInvoiceDraftTotal(); });
    updateInvoiceDraftTotal();
  }

  function validateManualInvoiceRows() {
    for (const row of $$('.manual-line-row', $('#invoiceManualItems'))) {
      const description = $('.manual-description', row).value.trim();
      const quantityInput = $('.manual-quantity', row);
      const rateInput = $('.manual-rate-input', row);
      const hasAnyEntry = description || quantityInput.value.trim() || rateInput.value.trim();
      if (!hasAnyEntry) continue;

      const quantity = Number(quantityInput.value);
      const rate = Number(rateInput.value || 0);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        quantityInput.focus();
        showToast('Quantity must be greater than 0.');
        return false;
      }
      if (!Number.isFinite(rate) || rate < 0) {
        rateInput.focus();
        showToast('Rate cannot be negative.');
        return false;
      }
    }
    return true;
  }

  function collectInvoiceLineItems() {
    const lines = [];
    $$('input[name="invoiceSession"]:checked', $('#invoiceSessionChoices')).forEach(input => {
      const session = data.sessions.find(s => s.id === input.value);
      if (!session) return;
      const existingLine = ui.invoiceFormId ? invoiceById(ui.invoiceFormId)?.lineItems?.find(item => item.type === 'session' && item.sessionId === session.id) : null;
      lines.push(invoiceSessionLine(session, existingLine?.id));
    });
    $$('.manual-line-row', $('#invoiceManualItems')).forEach(row => {
      const description = $('.manual-description', row).value.trim();
      const quantity = Number($('.manual-quantity', row).value || 0);
      const rateCents = Math.round(Number($('.manual-rate-input', row).value || 0) * 100);
      if (!description && !rateCents) return;
      lines.push({ id: row.dataset.lineId || uid('line'), type: 'manual', description: description || 'Custom item', quantity, rateCents, amountCents: Math.round(quantity * rateCents) });
    });
    return lines;
  }

  function updateInvoiceDraftTotal() {
    const lines = collectInvoiceLineItems();
    const total = lines.reduce((sum, item) => sum + item.amountCents, 0);
    const totalMinutes = lines.reduce((sum, item) => item.type === 'session' ? sum + Number(item.quantityMinutes || 0) : sum, 0);
    const count = lines.length;
    $('#invoiceDraftTotal').textContent = formatMoney(total, activeBusiness().currency);
    $('#invoiceDraftItemCount').textContent = `${durationExactLabel(totalMinutes)} · ${count} ${count === 1 ? 'line item' : 'line items'}`;
  }

  function releaseInvoiceSessions(invoice) {
    (invoice?.lineItems || []).filter(item => item.type === 'session').forEach(item => {
      const session = data.sessions.find(s => s.id === item.sessionId);
      if (session?.invoiceId === invoice.id) Object.assign(session, { invoiceId: null, invoiceStatus: 'uninvoiced', updatedAt: nowIso() });
    });
  }

  function assignInvoiceSessions(invoice) {
    (invoice?.lineItems || []).filter(item => item.type === 'session').forEach(item => {
      const session = data.sessions.find(s => s.id === item.sessionId);
      if (session) Object.assign(session, { invoiceId: invoice.id, invoiceStatus: invoice.status === 'sent' ? 'invoiced' : 'draft', updatedAt: nowIso() });
    });
  }

  function saveInvoice(event) {
    event.preventDefault();
    const clientId = $('#invoiceClient').value;
    const client = clientById(clientId);
    if (!validateManualInvoiceRows()) return;
    const lineItems = collectInvoiceLineItems();
    if (!client) { showToast('Choose a client for this invoice.'); return; }
    if (!lineItems.length) { showToast('Add at least one work session or custom line item.'); return; }
    const issueDate = $('#invoiceIssueDate').value;
    const dueDate = $('#invoiceDueDate').value;
    if (!issueDate || !dueDate) { showToast('Choose both an issue date and due date.'); return; }
    if (dueDate < issueDate) { showToast('Due date cannot be before the issue date.'); return; }
    const recipientSnapshot = { displayName: client.displayName, billingEmail: client.billingEmail || '', billingAddress: client.billingAddress || '' };
    const sender = activeBusiness();
    const senderSnapshot = { displayName: sender.legalName || sender.displayName, senderEmail: sender.invoiceSettings?.senderEmail || '', senderPhone: sender.invoiceSettings?.senderPhone || '', senderAddress: sender.invoiceSettings?.senderAddress || '', paymentInstructions: sender.invoiceSettings?.paymentInstructions || '' };

    let invoice;
    if (ui.invoiceFormId) {
      invoice = invoiceById(ui.invoiceFormId);
      if (!invoice) return;
      const before = deepClone(invoice);
      releaseInvoiceSessions(invoice);
      Object.assign(invoice, { clientId, recipientSnapshot, senderSnapshot, issueDate, dueDate, note: $('#invoiceNote').value.trim(), lineItems, updatedAt: nowIso() });
      assignInvoiceSessions(invoice);
      persist('updated', 'Invoice', invoice.id, { before, after: deepClone(invoice) });
      showToast(`${invoice.number} updated`);
    } else {
      invoice = { id: uid('invoice'), businessId: data.activeBusinessId, number: nextInvoiceNumber(), clientId, recipientSnapshot, senderSnapshot, issueDate, dueDate, note: $('#invoiceNote').value.trim(), status: 'draft', lineItems, createdAt: nowIso(), updatedAt: nowIso(), sentAt: null, voidedAt: null };
      data.invoices.push(invoice);
      assignInvoiceSessions(invoice);
      persist('created', 'Invoice', invoice.id, { number: invoice.number });
      showToast(`${invoice.number} saved as draft`);
    }
    ui.invoiceFormId = null;
    closeModal();
    renderAll();
    setView('money');
    setTimeout(() => openInvoiceDetail(invoice.id), 40);
  }

  function openInvoiceDetail(id) {
    const invoice = invoiceById(id); if (!invoice) return;
    const displayStatus = invoiceDisplayStatus(invoice);
    const payments = invoicePayments(invoice).slice().sort((a,b) => `${b.receivedDate}${b.createdAt}`.localeCompare(`${a.receivedDate}${a.createdAt}`));
    const paidCents = invoicePaidCents(invoice);
    const balanceCents = invoice.status === 'void' ? 0 : invoiceBalanceCents(invoice);
    const hasPayments = payments.length > 0;
    const canEdit = invoice.status !== 'void' && !hasPayments;
    $('#detailEyebrow').textContent = 'INVOICE';
    $('#detailTitle').textContent = invoice.number;
    const lineRows = (invoice.lineItems || []).map(item => {
      const qty = item.type === 'session' ? `${hoursLabel(item.quantityMinutes || 0)}` : `${Number(item.quantity || 0).toLocaleString('en-US',{maximumFractionDigits:2})}`;
      return `<div class="invoice-preview-line"><span><strong>${escapeHtml(item.description)}</strong><small>${item.type === 'session' ? 'Linked work session' : 'Custom line item'}</small></span><span>${escapeHtml(qty)}</span><span>${formatMoney(item.rateCents || 0, activeBusiness().currency)}</span><strong>${formatMoney(item.amountCents || 0, activeBusiness().currency)}</strong></div>`;
    }).join('');
    const primaryAction = invoice.status === 'draft'
      ? `<button class="primary-btn" data-mark-invoice-sent="${invoice.id}">Mark sent</button>`
      : invoice.status === 'sent' && balanceCents > 0
        ? `<button class="primary-btn" data-record-invoice-payment="${invoice.id}">＋ Record payment</button>`
        : '';
    const destructive = invoice.status === 'draft'
      ? `<button type="button" class="danger-menu-item" data-delete-invoice="${invoice.id}">Delete draft</button>`
      : invoice.status === 'sent'
        ? hasPayments
          ? `<button type="button" class="disabled-menu-item" disabled title="Delete linked payments first">Payments lock invoice reversal</button>`
          : `<button type="button" data-invoice-draft="${invoice.id}">Move back to draft</button><button type="button" class="danger-menu-item" data-void-invoice="${invoice.id}">Void invoice</button>`
        : '';
    const summary = paidCents > 0
      ? `<div><span>Total hours</span><strong>${durationExactLabel(invoiceTotalMinutes(invoice))}</strong></div><div><span>Invoice total</span><strong>${formatMoney(invoiceTotalCents(invoice), activeBusiness().currency)}</strong></div><div><span>Paid</span><strong>${formatMoney(paidCents, activeBusiness().currency)}</strong></div><div class="invoice-preview-amount"><span>Amount due</span><strong>${formatMoney(balanceCents, activeBusiness().currency)}</strong></div>`
      : `<div><span>Total hours</span><strong>${durationExactLabel(invoiceTotalMinutes(invoice))}</strong></div><div class="invoice-preview-amount"><span>Amount due</span><strong>${formatMoney(invoiceTotalCents(invoice), activeBusiness().currency)}</strong></div>`;
    const paymentHistory = payments.length ? `<div class="invoice-payment-history"><div class="panel-title-row"><div><p class="eyebrow">PAYMENTS</p><h3>Received toward this invoice</h3></div><span class="quiet-badge green">${formatMoney(paidCents, activeBusiness().currency)}</span></div><div class="payment-mini-list">${payments.map(payment => `<button data-payment-detail="${payment.id}"><span><strong>${formatDate(payment.receivedDate)}</strong><small>${escapeHtml(paymentMethodLabel(payment.method))}${payment.reference ? ` · ${escapeHtml(payment.reference)}` : ''}</small></span><strong>${formatMoney(payment.amountCents || 0, activeBusiness().currency)}</strong></button>`).join('')}</div></div>` : '';
    const lockNote = hasPayments ? `<div class="trace-banner payment-lock-banner"><span>✓</span><div><strong>Payment-linked invoice</strong><small>This invoice has received money. Its billable contents and reversal actions are locked until the linked payment records are corrected or removed.</small></div></div>` : '';
    $('#detailBody').innerHTML = `<div class="detail-actions invoice-detail-actions"><button class="secondary-btn" data-print-invoice="${invoice.id}">Print / Save PDF</button>${canEdit ? `<button class="secondary-btn" data-edit-invoice="${invoice.id}">Edit</button>` : ''}${primaryAction}${destructive ? `<details class="record-more"><summary aria-label="More invoice actions" title="More actions">•••</summary><div class="record-more-popover">${destructive}</div></details>` : ''}</div><div id="detailDeleteConfirm"></div>
      <div class="invoice-preview-card">
        <div class="invoice-preview-top"><div><span class="invoice-wordmark">${escapeHtml(invoice.senderSnapshot?.displayName || activeBusiness().displayName)}</span><small>${escapeHtml(invoice.senderSnapshot?.senderEmail || '')}${invoice.senderSnapshot?.senderEmail && invoice.senderSnapshot?.senderPhone ? ' · ' : ''}${escapeHtml(invoice.senderSnapshot?.senderPhone || '')}</small></div><div class="invoice-preview-number"><span class="status-pill ${invoiceStatusClass(invoice)}">${escapeHtml(displayStatus)}</span><strong>${escapeHtml(invoice.number)}</strong></div></div>
        <div class="invoice-preview-parties"><div><small>BILL TO</small><strong>${escapeHtml(invoice.recipientSnapshot?.displayName || 'Client')}</strong><p>${escapeHtml(invoice.recipientSnapshot?.billingEmail || '')}${invoice.recipientSnapshot?.billingEmail && invoice.recipientSnapshot?.billingAddress ? '<br>' : ''}${escapeHtml(invoice.recipientSnapshot?.billingAddress || '')}</p></div><div class="invoice-date-pair"><span><small>Issued</small><strong>${formatDate(invoice.issueDate)}</strong></span><span><small>Due</small><strong>${formatDate(invoice.dueDate)}</strong></span></div></div>
        <div class="invoice-preview-head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span></div>${lineRows}
        <div class="invoice-preview-summary">${summary}</div>
        ${invoice.note ? `<div class="invoice-preview-note"><small>NOTE</small><p>${escapeHtml(invoice.note)}</p></div>` : ''}
        ${invoice.senderSnapshot?.paymentInstructions ? `<div class="invoice-preview-note"><small>PAYMENT</small><p>${escapeHtml(invoice.senderSnapshot.paymentInstructions)}</p></div>` : ''}
      </div>
      ${paymentHistory}${lockNote}
      <div class="trace-banner"><span>↳</span><div><strong>${(invoice.lineItems || []).filter(item => item.type === 'session').length} linked work ${(invoice.lineItems || []).filter(item => item.type === 'session').length === 1 ? 'session' : 'sessions'}</strong><small>The invoice stores its own client, sender, rate, and line-item snapshots. Payments are separate cash records and never make the invoice itself count as cash received twice.</small></div></div>`;
    openModal($('#detailPanel'));
    $('[data-edit-invoice]')?.addEventListener('click', () => openInvoiceForm({ existingId: id }));
    $('[data-print-invoice]')?.addEventListener('click', () => printInvoice(id));
    $('[data-mark-invoice-sent]')?.addEventListener('click', () => markInvoiceSent(id));
    $('[data-record-invoice-payment]')?.addEventListener('click', () => openPaymentForm({ invoiceId: id }));
    $('[data-invoice-draft]')?.addEventListener('click', () => moveInvoiceToDraft(id));
    $('[data-delete-invoice]')?.addEventListener('click', () => showInvoiceActionConfirmation('delete', id));
    $('[data-void-invoice]')?.addEventListener('click', () => showInvoiceActionConfirmation('void', id));
    $$('[data-payment-detail]', $('#detailBody')).forEach(btn => btn.addEventListener('click', () => openPaymentDetail(btn.dataset.paymentDetail)));
  }

  function markInvoiceSent(id) {
    const invoice = invoiceById(id); if (!invoice || invoice.status !== 'draft') return;
    const before = deepClone(invoice);
    invoice.status = 'sent'; invoice.sentAt = nowIso(); invoice.updatedAt = nowIso();
    assignInvoiceSessions(invoice);
    persist('status_changed', 'Invoice', invoice.id, { from: before.status, to: 'sent' });
    renderAll(); openInvoiceDetail(id); showToast(`${invoice.number} marked sent`);
  }

  function moveInvoiceToDraft(id) {
    const invoice = invoiceById(id); if (!invoice || invoice.status !== 'sent') return;
    if (invoicePayments(invoice).length) { showToast('Delete or correct linked payments before moving this invoice back to Draft.'); return; }
    invoice.status = 'draft'; invoice.sentAt = null; invoice.updatedAt = nowIso();
    assignInvoiceSessions(invoice);
    persist('status_changed', 'Invoice', invoice.id, { to: 'draft' });
    renderAll(); openInvoiceDetail(id); showToast(`${invoice.number} moved to draft`);
  }

  function showInvoiceActionConfirmation(action, id) {
    const invoice = invoiceById(id); const host = $('#detailDeleteConfirm'); if (!invoice || !host) return;
    $('.record-more[open]', $('#detailBody'))?.removeAttribute('open');
    const isVoid = action === 'void';
    host.innerHTML = `<div class="delete-confirm-card"><div><strong>${isVoid ? `Void ${escapeHtml(invoice.number)}?` : `Delete ${escapeHtml(invoice.number)}?`}</strong><p>${isVoid ? 'The invoice will stay in your records as Void, and its linked work sessions will become available to invoice again.' : 'This draft will be permanently removed and its linked work sessions will become uninvoiced again.'}</p></div><div class="delete-confirm-actions"><button type="button" class="secondary-btn" data-cancel-delete>Cancel</button><button type="button" class="danger-btn" data-confirm-invoice-action>${isVoid ? 'Void invoice' : 'Delete draft'}</button></div></div>`;
    $('[data-cancel-delete]', host).addEventListener('click', () => { host.innerHTML = ''; });
    $('[data-confirm-invoice-action]', host).addEventListener('click', () => isVoid ? voidInvoice(id) : deleteDraftInvoice(id));
  }

  function deleteDraftInvoice(id) {
    const invoice = invoiceById(id); if (!invoice || invoice.status !== 'draft') return;
    releaseInvoiceSessions(invoice);
    data.invoices = data.invoices.filter(item => item.id !== id);
    data.auditEvents = data.auditEvents.filter(event => event.entityId !== id);
    data.auditEvents.push({ id: uid('audit'), businessId: data.activeBusinessId, eventType: 'deleted', entityType: 'Invoice', entityId: id, details: { number: invoice.number }, occurredAt: nowIso() });
    repository.save(data); closeModal(); renderAll(); setView('money'); showToast(`${invoice.number} deleted`);
  }

  function voidInvoice(id) {
    const invoice = invoiceById(id); if (!invoice || invoice.status !== 'sent') return;
    if (invoicePayments(invoice).length) { showToast('Delete or correct linked payments before voiding this invoice.'); return; }
    invoice.status = 'void'; invoice.voidedAt = nowIso(); invoice.updatedAt = nowIso();
    releaseInvoiceSessions(invoice);
    persist('status_changed', 'Invoice', invoice.id, { to: 'void' });
    renderAll(); openInvoiceDetail(id); showToast(`${invoice.number} voided`);
  }

  function printInvoice(id) {
    const invoice = invoiceById(id); if (!invoice) return;
    const payments = invoicePayments(invoice).slice().sort((a,b) => `${a.receivedDate}${a.createdAt}`.localeCompare(`${b.receivedDate}${b.createdAt}`));
    const paidCents = invoicePaidCents(invoice);
    const balanceCents = invoice.status === 'void' ? 0 : invoiceBalanceCents(invoice);
    const lineRows = (invoice.lineItems || []).map(item => `<tr><td><strong>${escapeHtml(item.description)}</strong></td><td>${item.type === 'session' ? hoursLabel(item.quantityMinutes || 0) : Number(item.quantity || 0).toLocaleString('en-US',{maximumFractionDigits:2})}</td><td>${formatMoney(item.rateCents || 0, activeBusiness().currency)}</td><td><strong>${formatMoney(item.amountCents || 0, activeBusiness().currency)}</strong></td></tr>`).join('');
    const paymentRows = payments.map(payment => `<tr><td>${formatDate(payment.receivedDate)}</td><td>${escapeHtml(paymentMethodLabel(payment.method))}</td><td>${escapeHtml(payment.reference || '—')}</td><td><strong>${formatMoney(payment.amountCents || 0, activeBusiness().currency)}</strong></td></tr>`).join('');
    const popup = window.open('', '_blank');
    if (!popup) { showToast('Allow pop-ups to print or save the invoice as PDF.'); return; }
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(invoice.number)}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#15171b;margin:0;padding:48px}*{box-sizing:border-box}.top{display:flex;justify-content:space-between;gap:30px;margin-bottom:50px}.brand{font-size:24px;font-weight:800}.num{text-align:right}.num strong{display:block;font-size:28px;margin-top:8px}.meta{display:grid;grid-template-columns:1fr auto;gap:40px;margin-bottom:38px}.meta small,.note small,.payments small{color:#7b8088;font-weight:700;letter-spacing:.08em}.dates{display:flex;gap:34px}.dates span{display:flex;flex-direction:column;gap:5px}table{width:100%;border-collapse:collapse}th{font-size:11px;color:#7b8088;text-align:left;border-bottom:1px solid #ddd;padding:10px 8px}td{padding:14px 8px;border-bottom:1px solid #eee;font-size:13px}th:last-child,td:last-child{text-align:right}.invoice-summary{display:flex;justify-content:flex-end;gap:38px;padding:22px 8px 4px;flex-wrap:wrap}.invoice-summary>div{display:flex;flex-direction:column;gap:5px;min-width:105px}.invoice-summary span{font-size:11px;color:#7b8088;font-weight:700;letter-spacing:.04em}.invoice-summary strong{font-size:18px}.invoice-summary .amount{text-align:right}.invoice-summary .amount strong{font-size:22px}.note{margin-top:30px;max-width:650px;white-space:pre-wrap}.payments{margin-top:32px}.payments h3{margin:5px 0 8px}.muted{color:#777}@media print{body{padding:20px}}</style></head><body><div class="top"><div><div class="brand">${escapeHtml(invoice.senderSnapshot?.displayName || activeBusiness().displayName)}</div><div class="muted">${escapeHtml(invoice.senderSnapshot?.senderEmail || '')}${invoice.senderSnapshot?.senderPhone ? ` · ${escapeHtml(invoice.senderSnapshot.senderPhone)}` : ''}</div><div class="muted">${escapeHtml(invoice.senderSnapshot?.senderAddress || '')}</div></div><div class="num"><span>INVOICE</span><strong>${escapeHtml(invoice.number)}</strong></div></div><div class="meta"><div><small>BILL TO</small><h3>${escapeHtml(invoice.recipientSnapshot?.displayName || 'Client')}</h3><div class="muted">${escapeHtml(invoice.recipientSnapshot?.billingEmail || '')}</div><div class="muted">${escapeHtml(invoice.recipientSnapshot?.billingAddress || '')}</div></div><div class="dates"><span><small>ISSUED</small><strong>${formatDate(invoice.issueDate)}</strong></span><span><small>DUE</small><strong>${formatDate(invoice.dueDate)}</strong></span></div></div><table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${lineRows}</tbody></table><div class="invoice-summary"><div><span>TOTAL HOURS</span><strong>${durationExactLabel(invoiceTotalMinutes(invoice))}</strong></div><div><span>INVOICE TOTAL</span><strong>${formatMoney(invoiceTotalCents(invoice), activeBusiness().currency)}</strong></div>${paidCents ? `<div><span>PAID</span><strong>${formatMoney(paidCents, activeBusiness().currency)}</strong></div>` : ''}<div class="amount"><span>AMOUNT DUE</span><strong>${formatMoney(balanceCents, activeBusiness().currency)}</strong></div></div>${payments.length ? `<div class="payments"><small>PAYMENTS RECEIVED</small><h3>${formatMoney(paidCents, activeBusiness().currency)} received</h3><table><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead><tbody>${paymentRows}</tbody></table></div>` : ''}${invoice.note ? `<div class="note"><small>NOTE</small><p>${escapeHtml(invoice.note)}</p></div>` : ''}${invoice.senderSnapshot?.paymentInstructions ? `<div class="note"><small>PAYMENT</small><p>${escapeHtml(invoice.senderSnapshot.paymentInstructions)}</p></div>` : ''}<script>window.onload=()=>setTimeout(()=>window.print(),150);<\/script></body></html>`);
    popup.document.close();
  }

  function eligiblePaymentInvoices(existingPayment = null) {
    return businessInvoices().filter(invoice => {
      if (invoice.status !== 'sent') return false;
      const currentAmount = existingPayment?.invoiceId === invoice.id ? Number(existingPayment.amountCents || 0) : 0;
      const remainingBeforeCurrent = invoiceTotalCents(invoice) - Math.max(0, invoicePaidCents(invoice) - currentAmount);
      return remainingBeforeCurrent > 0 || existingPayment?.invoiceId === invoice.id;
    }).sort((a,b) => `${b.issueDate || ''}${b.createdAt || ''}`.localeCompare(`${a.issueDate || ''}${a.createdAt || ''}`));
  }

  function paymentRemainingBeforeCurrent(invoice, existingPayment = null) {
    if (!invoice) return 0;
    const currentAmount = existingPayment?.invoiceId === invoice.id ? Number(existingPayment.amountCents || 0) : 0;
    return Math.max(0, invoiceTotalCents(invoice) - Math.max(0, invoicePaidCents(invoice) - currentAmount));
  }

  function openPaymentForm({ existingId = null, invoiceId = null } = {}) {
    $('#formSheet').classList.remove('session-form-sheet');
    const existing = existingId ? paymentById(existingId) : null;
    const invoices = eligiblePaymentInvoices(existing);
    const preselectedInvoice = invoiceId ? invoiceById(invoiceId) : existing?.invoiceId ? invoiceById(existing.invoiceId) : null;
    const defaultKind = preselectedInvoice ? 'invoice' : existing?.kind ? existing.kind : invoices.length ? 'invoice' : 'direct';
    ui.formMode = 'payment';
    ui.formRecordId = existingId;
    $('#formEyebrow').textContent = existing ? 'EDIT PAYMENT' : 'MONEY RECEIVED';
    $('#formTitle').textContent = existing ? 'Edit payment' : 'Record payment';
    $('#formSubmitBtn').textContent = existing ? 'Save changes' : 'Record payment';
    const today = businessToday();
    const selectedInvoiceId = preselectedInvoice?.id || (defaultKind === 'invoice' && invoices.length === 1 ? invoices[0].id : '');
    const selectedInvoice = selectedInvoiceId ? invoiceById(selectedInvoiceId) : null;
    const startingAmountCents = existing?.amountCents ?? (selectedInvoice ? paymentRemainingBeforeCurrent(selectedInvoice, existing) : 0);
    const clients = businessClients();
    const defaultMethod = existing?.method || businessPayments().slice().sort((a,b) => `${b.receivedDate || ''}${b.createdAt || ''}`.localeCompare(`${a.receivedDate || ''}${a.createdAt || ''}`))[0]?.method || 'zelle';
    $('#formFields').innerHTML = `
      <div class="payment-type-switch" role="group" aria-label="Payment source">
        <button type="button" class="payment-type-option ${defaultKind === 'invoice' ? 'active' : ''}" data-payment-kind="invoice"><span>Invoice payment</span><small>Apply money to a sent invoice</small></button>
        <button type="button" class="payment-type-option ${defaultKind === 'direct' ? 'active' : ''}" data-payment-kind="direct"><span>Other income</span><small>Money received without an invoice</small></button>
      </div>
      <input type="hidden" name="kind" id="paymentKind" value="${defaultKind}" />
      <div id="paymentInvoiceFields" ${defaultKind === 'invoice' ? '' : 'hidden'}>
        <label class="field"><span>Invoice</span><select name="invoiceId" id="paymentInvoice">${invoices.length ? `<option value="">Choose invoice</option>${invoices.map(invoice => `<option value="${invoice.id}" ${invoice.id === selectedInvoiceId ? 'selected' : ''}>${escapeHtml(invoice.number)} · ${escapeHtml(invoice.recipientSnapshot?.displayName || 'Client')} · ${formatMoney(paymentRemainingBeforeCurrent(invoice, existing), activeBusiness().currency)} remaining</option>`).join('')}` : '<option value="">No unpaid sent invoices</option>'}</select><small id="paymentInvoiceHint">${selectedInvoice ? `${formatMoney(paymentRemainingBeforeCurrent(selectedInvoice, existing), activeBusiness().currency)} can be applied to this invoice.` : 'Only sent invoices with an outstanding balance appear.'}</small></label>
      </div>
      <div id="paymentDirectFields" ${defaultKind === 'direct' ? '' : 'hidden'}>
        <div class="field-row"><label class="field"><span>Source / payer</span><input name="sourceName" id="paymentSourceName" maxlength="120" placeholder="e.g. Client, platform, cash job" value="${escapeHtml(existing?.sourceName || '')}" /></label><label class="field"><span>Client <em>optional</em></span><select name="directClientId" id="paymentDirectClient"><option value="">No linked client</option>${clients.map(client => `<option value="${client.id}" ${client.id === existing?.clientId ? 'selected' : ''}>${escapeHtml(client.displayName)}</option>`).join('')}</select></label></div>
        <label class="field"><span>Description <em>optional</em></span><input name="description" maxlength="180" placeholder="What was this income for?" value="${escapeHtml(existing?.description || '')}" /></label>
      </div>
      <div class="field-row payment-core-row"><label class="field"><span>Amount received</span><div class="money-input"><span>$</span><input name="amount" id="paymentAmount" required inputmode="decimal" min="0.01" step="0.01" type="number" value="${startingAmountCents ? (startingAmountCents/100).toFixed(2) : ''}" placeholder="0.00" /></div></label><label class="field"><span>Date received</span><input name="receivedDate" type="date" required value="${escapeHtml(existing?.receivedDate || today)}" /></label></div>
      <div class="field-row"><label class="field"><span>Method</span><select name="method"><option value="zelle" ${defaultMethod === 'zelle' ? 'selected' : ''}>Zelle</option><option value="venmo" ${defaultMethod === 'venmo' ? 'selected' : ''}>Venmo</option><option value="ach" ${defaultMethod === 'ach' ? 'selected' : ''}>ACH</option><option value="direct_deposit" ${defaultMethod === 'direct_deposit' ? 'selected' : ''}>Direct deposit</option><option value="cash" ${defaultMethod === 'cash' ? 'selected' : ''}>Cash</option><option value="check" ${defaultMethod === 'check' ? 'selected' : ''}>Check</option><option value="card" ${defaultMethod === 'card' ? 'selected' : ''}>Card</option><option value="other" ${defaultMethod === 'other' ? 'selected' : ''}>Other</option></select></label><label class="field"><span>Reference <em>optional</em></span><input name="reference" maxlength="100" placeholder="Confirmation, check #, memo…" value="${escapeHtml(existing?.reference || '')}" /></label></div>
      <label class="field"><span>Note <em>optional</em></span><textarea name="notes" rows="2" maxlength="500" placeholder="Anything useful about this payment…">${escapeHtml(existing?.notes || '')}</textarea></label>
      <div class="form-info-note payment-trace-note"><strong>Received-money rule:</strong> this payment becomes money received. A linked invoice remains the billing record and is not counted again as a second cash entry.</div>`;
    openModal($('#formSheet'));
    setupPaymentFormInteractions(existing);
  }

  function setupPaymentFormInteractions(existing = null) {
    const kindInput = $('#paymentKind');
    const invoiceFields = $('#paymentInvoiceFields');
    const directFields = $('#paymentDirectFields');
    const invoiceSelect = $('#paymentInvoice');
    const amountInput = $('#paymentAmount');
    const hint = $('#paymentInvoiceHint');

    function setKind(kind) {
      kindInput.value = kind;
      $$('[data-payment-kind]', $('#formFields')).forEach(btn => btn.classList.toggle('active', btn.dataset.paymentKind === kind));
      invoiceFields.hidden = kind !== 'invoice';
      directFields.hidden = kind !== 'direct';
      if (kind === 'invoice') refreshInvoice(false);
    }

    function refreshInvoice(forceAmount = true) {
      const invoice = invoiceById(invoiceSelect?.value);
      if (!invoice) {
        if (hint) hint.textContent = 'Only sent invoices with an outstanding balance appear.';
        return;
      }
      const remaining = paymentRemainingBeforeCurrent(invoice, existing);
      if (hint) hint.textContent = `${formatMoney(remaining, activeBusiness().currency)} can be applied to this invoice.`;
      if (forceAmount && amountInput) amountInput.value = remaining ? (remaining/100).toFixed(2) : '';
    }

    $$('[data-payment-kind]', $('#formFields')).forEach(btn => btn.addEventListener('click', () => setKind(btn.dataset.paymentKind)));
    invoiceSelect?.addEventListener('change', () => refreshInvoice(true));
    setKind(kindInput.value);
  }

  function savePayment(form) {
    const kind = form.get('kind');
    const amountCents = Math.round(Number(form.get('amount')) * 100);
    const receivedDate = form.get('receivedDate');
    if (!Number.isFinite(amountCents) || amountCents <= 0) { showToast('Payment amount must be greater than $0.'); return false; }
    if (!receivedDate) { showToast('Choose the date the money was received.'); return false; }

    const existing = ui.formRecordId ? paymentById(ui.formRecordId) : null;
    let payload;
    if (kind === 'invoice') {
      const invoiceId = form.get('invoiceId');
      const invoice = invoiceById(invoiceId);
      if (!invoice || invoice.status !== 'sent') { showToast('Choose a sent invoice with an outstanding balance.'); return false; }
      const remainingBeforeCurrent = paymentRemainingBeforeCurrent(invoice, existing);
      if (amountCents > remainingBeforeCurrent) {
        showToast(`This invoice has ${formatMoney(remainingBeforeCurrent, activeBusiness().currency)} remaining. Record any extra as Other income.`);
        return false;
      }
      payload = {
        kind: 'invoice', invoiceId: invoice.id, invoiceNumberSnapshot: invoice.number,
        clientId: invoice.clientId || null, clientNameSnapshot: invoice.recipientSnapshot?.displayName || clientById(invoice.clientId)?.displayName || 'Client',
        sourceName: '', description: '', amountCents, receivedDate, method: form.get('method'),
        reference: (form.get('reference') || '').trim(), notes: (form.get('notes') || '').trim()
      };
    } else {
      const sourceName = (form.get('sourceName') || '').trim();
      if (!sourceName) { showToast('Add a source or payer for other income.'); return false; }
      const client = clientById(form.get('directClientId'));
      payload = {
        kind: 'direct', invoiceId: null, invoiceNumberSnapshot: '', clientId: client?.id || null,
        clientNameSnapshot: client?.displayName || '', sourceName, description: (form.get('description') || '').trim(),
        amountCents, receivedDate, method: form.get('method'), reference: (form.get('reference') || '').trim(), notes: (form.get('notes') || '').trim()
      };
    }

    if (existing) {
      const before = deepClone(existing);
      Object.assign(existing, payload, { updatedAt: nowIso() });
      persist('updated', 'Payment', existing.id, { before, after: deepClone(existing) });
      showToast('Payment updated');
    } else {
      const payment = { id: uid('payment'), businessId: data.activeBusinessId, ...payload, createdAt: nowIso(), updatedAt: nowIso() };
      data.payments.push(payment);
      persist('created', 'Payment', payment.id, { kind: payment.kind, invoiceId: payment.invoiceId, amountCents: payment.amountCents });
      ui.formRecordId = payment.id;
      showToast(payment.kind === 'invoice' ? `Payment applied to ${payment.invoiceNumberSnapshot}` : 'Income recorded');
    }
    return true;
  }

  function openPaymentDetail(id) {
    const payment = paymentById(id); if (!payment) return;
    const invoice = payment.invoiceId ? invoiceById(payment.invoiceId) : null;
    $('#detailEyebrow').textContent = payment.kind === 'invoice' ? 'PAYMENT' : 'OTHER INCOME';
    $('#detailTitle').textContent = formatMoney(payment.amountCents || 0, activeBusiness().currency);
    const sourceTitle = payment.kind === 'invoice' ? (payment.invoiceNumberSnapshot || invoice?.number || 'Invoice') : (payment.sourceName || 'Other income');
    const sourceSub = payment.kind === 'invoice' ? (payment.clientNameSnapshot || invoice?.recipientSnapshot?.displayName || 'Client') : (payment.clientNameSnapshot || payment.description || 'Direct income');
    const invoiceBalance = invoice ? invoiceBalanceCents(invoice) : null;
    $('#detailBody').innerHTML = `<div class="detail-actions"><button class="secondary-btn" data-edit-payment="${payment.id}">Edit</button>${invoice ? `<button class="primary-btn" data-payment-invoice="${invoice.id}">View ${escapeHtml(invoice.number)}</button>` : ''}<details class="record-more"><summary aria-label="More payment actions" title="More actions">•••</summary><div class="record-more-popover"><button type="button" class="danger-menu-item" data-delete-payment="${payment.id}">Delete payment</button></div></details></div><div id="detailDeleteConfirm"></div>
      <div class="detail-metrics payment-detail-metrics"><div><small>Received</small><strong>${formatDate(payment.receivedDate)}</strong></div><div><small>Method</small><strong>${escapeHtml(paymentMethodLabel(payment.method))}</strong></div><div><small>Type</small><strong>${escapeHtml(paymentKindLabel(payment))}</strong></div></div>
      <div class="payment-hero-card"><small>SOURCE</small><strong>${escapeHtml(sourceTitle)}</strong><span>${escapeHtml(sourceSub)}</span>${invoice ? `<div class="payment-balance-line"><span>Invoice balance now</span><strong>${formatMoney(invoiceBalance, activeBusiness().currency)}</strong></div>` : ''}</div>
      ${payment.reference ? `<div class="detail-section"><p class="eyebrow">REFERENCE</p><p>${escapeHtml(payment.reference)}</p></div>` : ''}
      ${payment.description && payment.kind === 'direct' ? `<div class="detail-section"><p class="eyebrow">DESCRIPTION</p><p>${escapeHtml(payment.description)}</p></div>` : ''}
      ${payment.notes ? `<div class="detail-section"><p class="eyebrow">NOTE</p><p>${escapeHtml(payment.notes)}</p></div>` : ''}
      <div class="trace-banner"><span>↳</span><div><strong>${payment.kind === 'invoice' ? 'Linked cash record' : 'Direct income record'}</strong><small>${payment.kind === 'invoice' ? `This payment is the cash-received record for ${escapeHtml(payment.invoiceNumberSnapshot || invoice?.number || 'the invoice')}. The invoice itself remains separate and is not counted again as received income.` : 'This income did not require an invoice, so this payment record itself is the source of the received-income entry.'}</small></div></div>`;
    openModal($('#detailPanel'));
    $('[data-edit-payment]')?.addEventListener('click', () => openPaymentForm({ existingId: id }));
    $('[data-payment-invoice]')?.addEventListener('click', () => { closeModal(); setView('money'); setTimeout(() => openInvoiceDetail(invoice.id), 20); });
    $('[data-delete-payment]')?.addEventListener('click', () => showPaymentDeleteConfirmation(id));
  }

  function showPaymentDeleteConfirmation(id) {
    const payment = paymentById(id); const host = $('#detailDeleteConfirm'); if (!payment || !host) return;
    $('.record-more[open]', $('#detailBody'))?.removeAttribute('open');
    host.innerHTML = `<div class="delete-confirm-card"><div><strong>Delete this ${formatMoney(payment.amountCents || 0, activeBusiness().currency)} payment?</strong><p>${payment.kind === 'invoice' ? `It will be removed from ${escapeHtml(payment.invoiceNumberSnapshot || 'the linked invoice')} and that invoice’s outstanding balance will increase again.` : 'It will be removed from received income.'} This cannot be undone.</p></div><div class="delete-confirm-actions"><button type="button" class="secondary-btn" data-cancel-delete>Cancel</button><button type="button" class="danger-btn" data-confirm-payment-delete>Delete payment</button></div></div>`;
    $('[data-cancel-delete]', host)?.addEventListener('click', () => { host.innerHTML = ''; });
    $('[data-confirm-payment-delete]', host)?.addEventListener('click', () => deletePayment(id));
  }

  function deletePayment(id) {
    const payment = paymentById(id); if (!payment) return;
    const invoiceId = payment.invoiceId;
    data.payments = data.payments.filter(item => item.id !== id);
    data.auditEvents = data.auditEvents.filter(event => event.entityId !== id);
    data.auditEvents.push({ id: uid('audit'), businessId: data.activeBusinessId, eventType: 'deleted', entityType: 'Payment', entityId: id, details: { kind: payment.kind, invoiceId, amountCents: payment.amountCents }, occurredAt: nowIso() });
    repository.save(data);
    closeModal(); renderAll(); setView('money');
    showToast('Payment deleted');
    if (invoiceId && invoiceById(invoiceId)) setTimeout(() => openInvoiceDetail(invoiceId), 35);
  }

  function expenseSessionOptions(clientId, selectedId = '') {
    if (!clientId) return '<option value="">No linked session</option>';
    const sessions = businessSessions().filter(session => session.clientId === clientId).slice().sort((a,b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`));
    return `<option value="">No linked session</option>${sessions.map(session => `<option value="${session.id}" ${session.id === selectedId ? 'selected' : ''}>${formatDate(session.date,{month:'short',day:'numeric'})} · ${escapeHtml(sessionTimeRangeLabel(session))}</option>`).join('')}`;
  }

  function openExpenseForm(existingId = null) {
    $('#formSheet').classList.remove('session-form-sheet');
    const existing = existingId ? expenseById(existingId) : null;
    const clients = businessClients();
    const recentCategory = businessExpenses().slice().sort((a,b) => `${b.date || ''}${b.createdAt || ''}`.localeCompare(`${a.date || ''}${a.createdAt || ''}`))[0]?.category || 'supplies';
    const selectedCategory = existing?.category || recentCategory;
    const classification = existing?.classification || 'business';
    const existingReceipt = existing?.receiptId ? receiptById(existing.receiptId) : null;
    ui.formMode = 'expense'; ui.formRecordId = existingId;
    $('#formEyebrow').textContent = existing ? 'EDIT EXPENSE' : 'MONEY SPENT';
    $('#formTitle').textContent = existing ? (existing.merchant || 'Expense') : 'New expense';
    $('#formSubmitBtn').textContent = existing ? 'Save changes' : 'Save expense';
    $('#formFields').innerHTML = `
      <div class="expense-type-switch" role="group" aria-label="Expense use">
        <button type="button" class="expense-type-option ${classification === 'business' ? 'active' : ''}" data-expense-class="business"><span>Business</span><small>100% business use</small></button>
        <button type="button" class="expense-type-option ${classification === 'mixed' ? 'active' : ''}" data-expense-class="mixed"><span>Mixed</span><small>Business + personal</small></button>
        <button type="button" class="expense-type-option ${classification === 'personal' ? 'active' : ''}" data-expense-class="personal"><span>Personal</span><small>Track, not business</small></button>
      </div>
      <input type="hidden" name="classification" id="expenseClassification" value="${classification}" />
      <div class="field-row three"><label class="field"><span>Date</span><input name="date" type="date" required value="${escapeHtml(existing?.date || businessToday())}" /></label><label class="field"><span>Merchant / source</span><input name="merchant" maxlength="120" required placeholder="e.g. Target" value="${escapeHtml(existing?.merchant || '')}" /></label><label class="field"><span>Amount</span><div class="money-input"><span>$</span><input name="total" id="expenseTotal" required inputmode="decimal" min="0.01" step="0.01" type="number" placeholder="0.00" value="${existing ? (existing.totalCents/100).toFixed(2) : ''}" /></div></label></div>
      <div class="field-row expense-amount-row ${classification === 'mixed' ? '' : 'single'}" id="expenseAmountRow"><label class="field"><span>Category</span><select name="category">${EXPENSE_CATEGORIES.map(([value,label]) => `<option value="${value}" ${selectedCategory === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label><label class="field" id="expenseBusinessAmountField" ${classification === 'mixed' ? '' : 'hidden'}><span>Business portion</span><div class="money-input"><span>$</span><input name="businessAmount" id="expenseBusinessAmount" inputmode="decimal" min="0" step="0.01" type="number" placeholder="0.00" value="${existing?.classification === 'mixed' ? (existing.businessCents/100).toFixed(2) : ''}" /></div></label></div>
      <label class="field" id="expensePurposeField" ${classification === 'personal' ? 'hidden' : ''}><span>Business purpose <em>recommended</em></span><input name="businessPurpose" maxlength="240" placeholder="Why was this needed for the business?" value="${escapeHtml(existing?.businessPurpose || '')}" /></label>
      <details class="optional-fields" ${existing?.clientId || existing?.sessionId || existing?.description ? 'open' : ''}><summary>Link & describe <span>optional</span></summary><div class="optional-fields-body"><div class="field-row"><label class="field"><span>Client</span><select name="clientId" id="expenseClient"><option value="">No linked client</option>${clients.map(client => `<option value="${client.id}" ${client.id === existing?.clientId ? 'selected' : ''}>${escapeHtml(client.displayName)}</option>`).join('')}</select></label><label class="field"><span>Session</span><select name="sessionId" id="expenseSession">${expenseSessionOptions(existing?.clientId || '', existing?.sessionId || '')}</select></label></div><label class="field"><span>Description</span><input name="description" maxlength="220" placeholder="Optional detail about the purchase" value="${escapeHtml(existing?.description || '')}" /></label></div></details>
      <div class="receipt-upload-card ${existingReceipt ? 'has-file' : ''}" id="receiptUploadCard"><div class="receipt-upload-icon">▧</div><div class="receipt-upload-copy"><strong>${existingReceipt ? escapeHtml(existingReceipt.fileName) : 'Attach receipt'}</strong><small id="receiptUploadMeta">${existingReceipt ? `${escapeHtml(fileSizeLabel(existingReceipt.size))} · choose a file to replace` : 'Image or PDF · optional · up to 12 MB'}</small></div><label class="receipt-upload-button"><input name="receiptFile" id="expenseReceiptFile" type="file" accept="image/*,application/pdf" /><span>${existingReceipt ? 'Replace' : 'Choose file'}</span></label></div>
      ${existingReceipt ? `<label class="expense-remove-receipt"><input type="checkbox" name="removeReceipt" value="yes" /> Remove current receipt</label>` : ''}
      <label class="review-toggle"><input type="checkbox" name="needsReview" value="yes" ${existing?.reviewStatus === 'needs_review' || (!existing && classification === 'mixed') ? 'checked' : ''}/><span><strong>Needs review</strong><small>Keep this expense in the Attention queue until you verify it.</small></span></label>`;
    openModal($('#formSheet'));

    const classInput = $('#expenseClassification');
    const mixedField = $('#expenseBusinessAmountField');
    const purposeField = $('#expensePurposeField');
    const businessAmount = $('#expenseBusinessAmount');
    const amountRow = $('#expenseAmountRow');
    const totalInput = $('#expenseTotal');
    function setClass(value) {
      classInput.value = value;
      $$('[data-expense-class]', $('#formFields')).forEach(btn => btn.classList.toggle('active', btn.dataset.expenseClass === value));
      mixedField.hidden = value !== 'mixed';
      amountRow?.classList.toggle('single', value !== 'mixed');
      purposeField.hidden = value === 'personal';
      if (value === 'mixed' && !businessAmount.value && totalInput.value) businessAmount.value = totalInput.value;
    }
    $$('[data-expense-class]', $('#formFields')).forEach(btn => btn.addEventListener('click', () => setClass(btn.dataset.expenseClass)));
    $('#expenseClient')?.addEventListener('change', event => { $('#expenseSession').innerHTML = expenseSessionOptions(event.target.value, ''); });
    $('#expenseReceiptFile')?.addEventListener('change', event => {
      const file = event.target.files?.[0]; if (!file) return;
      $('#receiptUploadCard').classList.add('has-file');
      $('.receipt-upload-copy strong', $('#receiptUploadCard')).textContent = file.name;
      $('#receiptUploadMeta').textContent = `${fileSizeLabel(file.size)} · ready to attach`;
    });
    setClass(classification);
  }

  async function saveExpense(form) {
    const totalCents = Math.round(Number(form.get('total')) * 100);
    const classification = form.get('classification');
    const date = form.get('date');
    const merchant = (form.get('merchant') || '').trim();
    if (!date || !merchant) { showToast('Add the expense date and merchant/source.'); return false; }
    if (!Number.isFinite(totalCents) || totalCents <= 0) { showToast('Expense amount must be greater than $0.'); return false; }
    if (!['business','mixed','personal'].includes(classification)) { showToast('Choose how this expense was used.'); return false; }
    let businessCents = classification === 'business' ? totalCents : classification === 'personal' ? 0 : Math.round(Number(form.get('businessAmount')) * 100);
    if (classification === 'mixed' && (!Number.isFinite(businessCents) || businessCents <= 0 || businessCents >= totalCents)) { showToast('For a mixed expense, the business portion must be greater than $0 and less than the total.'); return false; }
    const existing = ui.formRecordId ? expenseById(ui.formRecordId) : null;
    const client = clientById(form.get('clientId'));
    const session = data.sessions.find(item => item.id === form.get('sessionId'));
    if (session && client && session.clientId !== client.id) { showToast('The linked session must belong to the selected client.'); return false; }
    const purpose = classification === 'personal' ? '' : (form.get('businessPurpose') || '').trim();
    const manualReview = form.get('needsReview') === 'yes';
    const reviewStatus = manualReview || (classification !== 'personal' && !purpose) ? 'needs_review' : 'ready';
    let receiptId = existing?.receiptId || null;
    const file = form.get('receiptFile');
    const removeReceipt = form.get('removeReceipt') === 'yes';
    if (file && file instanceof File && file.size > 0) {
      if (file.size > 12 * 1024 * 1024) { showToast('Receipt files must be 12 MB or smaller.'); return false; }
      if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) { showToast('Use an image or PDF for the receipt.'); return false; }
      const newReceiptId = uid('receipt');
      try { await receiptBlobStore.put(newReceiptId, file); } catch (error) { console.error(error); showToast('Could not store the receipt file in this browser.'); return false; }
      if (receiptId) { await receiptBlobStore.delete(receiptId).catch(()=>{}); data.receipts = data.receipts.filter(item => item.id !== receiptId); }
      receiptId = newReceiptId;
      data.receipts.push({ id:newReceiptId, businessId:data.activeBusinessId, expenseId:existing?.id || null, fileName:file.name, mimeType:file.type, size:file.size, createdAt:nowIso() });
    } else if (removeReceipt && receiptId) {
      await receiptBlobStore.delete(receiptId).catch(()=>{});
      data.receipts = data.receipts.filter(item => item.id !== receiptId);
      receiptId = null;
    }
    const payload = { date, merchant, description:(form.get('description') || '').trim(), totalCents, classification, businessCents, category:form.get('category') || 'other', businessPurpose:purpose, clientId:client?.id || null, clientNameSnapshot:client?.displayName || existing?.clientNameSnapshot || '', sessionId:session?.id || null, sessionDateSnapshot:session?.date || existing?.sessionDateSnapshot || '', sessionTimeSnapshot:session ? sessionTimeRangeLabel(session) : existing?.sessionTimeSnapshot || '', reviewStatus, receiptId };
    if (existing) {
      const before = deepClone(existing); Object.assign(existing, payload, { updatedAt:nowIso() });
      const receipt = receiptId ? receiptById(receiptId) : null; if (receipt) receipt.expenseId = existing.id;
      persist('updated','Expense',existing.id,{ before, after:deepClone(existing) });
      showToast('Expense updated');
    } else {
      const expense = { id:uid('expense'), businessId:data.activeBusinessId, ...payload, createdAt:nowIso(), updatedAt:nowIso() };
      data.expenses.push(expense); const receipt = receiptId ? receiptById(receiptId) : null; if (receipt) receipt.expenseId = expense.id;
      persist('created','Expense',expense.id,{ totalCents, businessCents, classification, category:expense.category, receiptId });
      ui.formRecordId = expense.id; showToast(receiptId ? 'Expense and receipt saved' : 'Expense saved');
    }
    return true;
  }

  async function hydrateExpenseReceipt(expense) {
    const host = $('#expenseReceiptPreview'); if (!host || !expense?.receiptId) return;
    const receipt = receiptById(expense.receiptId); if (!receipt) return;
    try {
      const blob = await receiptBlobStore.get(receipt.id);
      if (!blob) { host.innerHTML = `<div class="receipt-missing"><span>!</span><div><strong>Receipt metadata found, file unavailable</strong><small>The browser may have cleared local file storage.</small></div></div>`; return; }
      if (receipt.mimeType?.startsWith('image/')) {
        const url = URL.createObjectURL(blob);
        host.innerHTML = `<img class="receipt-preview-image" src="${url}" alt="Receipt preview" /><div class="receipt-preview-footer"><span><strong>${escapeHtml(receipt.fileName)}</strong><small>${escapeHtml(fileSizeLabel(receipt.size))}</small></span><button type="button" class="secondary-btn compact-action" data-download-receipt>Download</button></div>`;
        $('img',host)?.addEventListener('load',()=>setTimeout(()=>URL.revokeObjectURL(url),2000),{once:true});
      } else {
        host.innerHTML = `<div class="receipt-file-tile"><span>PDF</span><div><strong>${escapeHtml(receipt.fileName)}</strong><small>${escapeHtml(fileSizeLabel(receipt.size))}</small></div><button type="button" class="secondary-btn compact-action" data-download-receipt>Download</button></div>`;
      }
      $('[data-download-receipt]', host)?.addEventListener('click', async () => downloadReceipt(receipt.id));
    } catch (error) { console.error(error); }
  }

  async function downloadReceipt(receiptId) {
    const receipt = receiptById(receiptId); if (!receipt) return;
    const blob = await receiptBlobStore.get(receiptId).catch(()=>null); if (!blob) { showToast('Receipt file is not available in local storage.'); return; }
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=receipt.fileName || 'receipt'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function openExpenseDetail(id) {
    const expense = expenseById(id); if (!expense) return;
    const client = expense.clientId ? clientById(expense.clientId) : null;
    const session = expense.sessionId ? data.sessions.find(item => item.id === expense.sessionId) : null;
    const clientLabel = client?.displayName || expense.clientNameSnapshot || '';
    const sessionLabel = session ? `${formatDate(session.date,{month:'short',day:'numeric'})} · ${sessionTimeRangeLabel(session)}` : expense.sessionDateSnapshot ? `${formatDate(expense.sessionDateSnapshot,{month:'short',day:'numeric'})}${expense.sessionTimeSnapshot ? ` · ${expense.sessionTimeSnapshot}` : ''}` : '';
    const receipt = expense.receiptId ? receiptById(expense.receiptId) : null;
    $('#detailEyebrow').textContent = 'EXPENSE'; $('#detailTitle').textContent = expense.merchant || 'Expense';
    $('#detailBody').innerHTML = `<div class="detail-actions"><button class="secondary-btn" data-edit-expense="${expense.id}">Edit</button>${expense.reviewStatus === 'needs_review' ? `<button class="primary-btn" data-review-expense="${expense.id}">Mark reviewed</button>` : ''}<details class="record-more"><summary aria-label="More expense actions" title="More actions">•••</summary><div class="record-more-popover"><button type="button" class="danger-menu-item" data-delete-expense="${expense.id}">Delete expense</button></div></details></div><div id="detailDeleteConfirm"></div>
      <div class="detail-metrics"><div><small>Date</small><strong>${formatDate(expense.date)}</strong></div><div><small>Total</small><strong>${formatMoney(expense.totalCents || 0, activeBusiness().currency)}</strong></div><div><small>Business portion</small><strong>${formatMoney(expense.businessCents || 0, activeBusiness().currency)}</strong></div></div>
      <div class="expense-hero-card"><div><span class="status-pill ${expenseClassStatus(expense.classification)}">${escapeHtml(expenseClassLabel(expense.classification))}</span>${expense.reviewStatus === 'needs_review' ? '<span class="status-pill review">Needs review</span>' : '<span class="status-pill success">Ready</span>'}</div><strong>${escapeHtml(expenseCategoryLabel(expense.category))}</strong><small>${escapeHtml(expense.description || 'No description')}</small></div>
      ${expense.businessPurpose ? `<div class="detail-section"><p class="eyebrow">BUSINESS PURPOSE</p><p>${escapeHtml(expense.businessPurpose)}</p></div>` : expense.classification !== 'personal' ? `<div class="detail-section subtle-warning"><p class="eyebrow">BUSINESS PURPOSE</p><p>Not documented yet.</p></div>` : ''}
      ${clientLabel || sessionLabel ? `<div class="detail-section"><p class="eyebrow">LINKED WORK</p>${clientLabel ? `<div class="trace-row"><span>Client</span><strong>${escapeHtml(clientLabel)}</strong></div>` : ''}${sessionLabel ? `<div class="trace-row"><span>Session</span><strong>${escapeHtml(sessionLabel)}</strong></div>` : ''}</div>` : ''}
      <div class="detail-section"><div class="section-inline-title"><div><p class="eyebrow">RECEIPT</p><h3>${receipt ? 'Attached evidence' : 'No receipt attached'}</h3></div></div><div id="expenseReceiptPreview">${receipt ? '<div class="receipt-loading">Loading receipt…</div>' : '<div class="receipt-empty-detail"><span>▧</span><small>Edit this expense to attach an image or PDF.</small></div>'}</div></div>
      <div class="trace-banner"><span>↳</span><div><strong>Expense source record</strong><small>The original total and business-use portion stay separate so later tax rules can use the evidence without rewriting what was actually spent.</small></div></div>`;
    openModal($('#detailPanel'));
    $('[data-edit-expense]')?.addEventListener('click',()=>openExpenseForm(id));
    $('[data-review-expense]')?.addEventListener('click',()=>markExpenseReviewed(id));
    $('[data-delete-expense]')?.addEventListener('click',()=>showExpenseDeleteConfirmation(id));
    hydrateExpenseReceipt(expense);
  }

  function markExpenseReviewed(id) {
    const expense = expenseById(id); if (!expense) return; const before = expense.reviewStatus; expense.reviewStatus='ready'; expense.updatedAt=nowIso(); persist('reviewed','Expense',id,{ before, after:'ready' }); renderAll(); openExpenseDetail(id); showToast('Expense marked reviewed');
  }

  function showExpenseDeleteConfirmation(id) {
    const expense = expenseById(id); const host=$('#detailDeleteConfirm'); if (!expense || !host) return;
    $('.record-more[open]', $('#detailBody'))?.removeAttribute('open');
    host.innerHTML=`<div class="delete-confirm-card"><div><strong>Delete this ${formatMoney(expense.totalCents || 0, activeBusiness().currency)} expense?</strong><p>${escapeHtml(expense.merchant || 'Expense')} and its linked receipt file, if any, will be permanently removed from this local workspace.</p></div><div class="delete-confirm-actions"><button type="button" class="secondary-btn" data-cancel-delete>Cancel</button><button type="button" class="danger-btn" data-confirm-expense-delete>Delete expense</button></div></div>`;
    $('[data-cancel-delete]',host)?.addEventListener('click',()=>host.innerHTML='');
    $('[data-confirm-expense-delete]',host)?.addEventListener('click',()=>deleteExpense(id));
  }

  async function deleteExpense(id) {
    const expense=expenseById(id); if (!expense) return; const receiptId=expense.receiptId;
    data.expenses=data.expenses.filter(item=>item.id!==id); data.receipts=data.receipts.filter(item=>item.expenseId!==id && item.id!==receiptId); data.auditEvents=data.auditEvents.filter(event=>event.entityId!==id);
    data.auditEvents.push({ id:uid('audit'),businessId:data.activeBusinessId,eventType:'deleted',entityType:'Expense',entityId:id,details:{ totalCents:expense.totalCents,businessCents:expense.businessCents,receiptId },occurredAt:nowIso() });
    repository.save(data); if (receiptId) await receiptBlobStore.delete(receiptId).catch(()=>{}); closeModal(); renderAll(); setView('money'); ui.moneyTab='expenses'; syncMoneyTabs(); showToast('Expense deleted');
  }

  function renderRecords() {
    const term=($('#receiptSearch')?.value || '').toLowerCase().trim();
    const receipts=businessReceipts().slice().sort((a,b)=>(b.createdAt || '').localeCompare(a.createdAt || '')).filter(receipt=>{
      const expense=expenseById(receipt.expenseId); return !term || `${receipt.fileName || ''} ${expense?.merchant || ''} ${expenseCategoryLabel(expense?.category)} ${expense?.businessPurpose || ''}`.toLowerCase().includes(term);
    });
    $('#receiptCount').textContent=`${businessReceipts().length} ${businessReceipts().length === 1 ? 'receipt' : 'receipts'}`;
    $('#receiptVault').innerHTML=receipts.length ? receipts.map(receipt=>{ const expense=expenseById(receipt.expenseId); if (!expense) return ''; return `<button class="receipt-vault-card" data-receipt-expense="${expense.id}"><span class="receipt-vault-icon">${receipt.mimeType === 'application/pdf' ? 'PDF' : '▧'}</span><span class="receipt-vault-main"><strong>${escapeHtml(expense.merchant || 'Expense')}</strong><small>${escapeHtml(receipt.fileName)} · ${escapeHtml(expenseCategoryLabel(expense.category))}</small></span><span class="receipt-vault-meta"><strong>${formatMoney(expense.totalCents || 0, activeBusiness().currency)}</strong><small>${formatDate(expense.date,{month:'short',day:'numeric',year:'numeric'})}</small></span>${expense.reviewStatus === 'needs_review' ? '<span class="receipt-review-dot" title="Needs review"></span>' : ''}</button>`; }).join('') : `<div class="large-empty receipt-empty"><div class="placeholder-icon small">▧</div><strong>${term ? 'No receipts match this search' : 'No receipts yet'}</strong><p>${term ? 'Try a merchant, category, or file name.' : 'Attach a receipt while saving an expense and it will appear here automatically.'}</p>${term ? '' : '<button class="secondary-btn" data-records-add-expense>Add expense with receipt</button>'}</div>`;
    $$('[data-receipt-expense]', $('#receiptVault')).forEach(btn=>btn.addEventListener('click',()=>openExpenseDetail(btn.dataset.receiptExpense)));
    $('[data-records-add-expense]', $('#receiptVault'))?.addEventListener('click',()=>openExpenseForm());
  }

  function renderCommandPalette() {
    const term = ($('#commandInput').value || '').toLowerCase().trim();
    const navigation = [
      ['home','⌂','Home','Dashboard and attention queue'], ['work','◫','Work','Clients and sessions'], ['money','$','Money','Invoices, payments, and expenses'], ['records','▤','Records','Documents and evidence']
    ].filter(item => !term || item.slice(2).join(' ').toLowerCase().includes(term));
    const clients = businessClients().filter(c => term && c.displayName.toLowerCase().includes(term)).slice(0,5);
    const sessions = businessSessions().filter(s => {
      const c = clientById(s.clientId); return term && `${c?.displayName || s.clientNameSnapshot || ''} ${s.date} ${s.notes || ''}`.toLowerCase().includes(term);
    }).slice(0,5);
    const invoices = businessInvoices().filter(invoice => term && `${invoice.number} ${invoice.recipientSnapshot?.displayName || ''} ${invoiceDisplayStatus(invoice)}`.toLowerCase().includes(term)).slice(0,5);
    const payments = businessPayments().filter(payment => term && `${paymentSourceLabel(payment)} ${payment.clientNameSnapshot || ''} ${payment.description || ''} ${payment.reference || ''} ${paymentMethodLabel(payment.method)} ${payment.amountCents || 0}`.toLowerCase().includes(term)).slice(0,5);
    const expenses = businessExpenses().filter(expense => term && `${expense.merchant || ''} ${expense.description || ''} ${expense.businessPurpose || ''} ${expenseCategoryLabel(expense.category)} ${expenseClassLabel(expense.classification)} ${expense.totalCents || 0}`.toLowerCase().includes(term)).slice(0,5);

    $('#commandBody').innerHTML = `${navigation.length ? `<p class="command-label">Navigation</p>${navigation.map(n => `<button class="command-result" data-command-view="${n[0]}"><span>${n[1]}</span><div><strong>${n[2]}</strong><small>${n[3]}</small></div></button>`).join('')}` : ''}
      ${clients.length ? `<p class="command-label">Clients</p>${clients.map(c => `<button class="command-result" data-command-client="${c.id}"><span>${escapeHtml(initials(c.displayName))}</span><div><strong>${escapeHtml(c.displayName)}</strong><small>Client · ${formatMoney(c.defaultRateCents || 0)}/hr</small></div></button>`).join('')}` : ''}
      ${sessions.length ? `<p class="command-label">Sessions</p>${sessions.map(s => `<button class="command-result" data-command-session="${s.id}"><span>◫</span><div><strong>${escapeHtml(clientById(s.clientId)?.displayName || s.clientNameSnapshot || 'Unassigned')}</strong><small>${formatDate(s.date)} · ${hoursLabel(sessionMinutes(s))}</small></div></button>`).join('')}` : ''}
      ${invoices.length ? `<p class="command-label">Invoices</p>${invoices.map(invoice => `<button class="command-result" data-command-invoice="${invoice.id}"><span>▧</span><div><strong>${escapeHtml(invoice.number)}</strong><small>${escapeHtml(invoice.recipientSnapshot?.displayName || 'Client')} · ${formatMoney(invoice.status === 'void' ? 0 : invoiceBalanceCents(invoice), activeBusiness().currency)} due · ${escapeHtml(invoiceDisplayStatus(invoice))}</small></div></button>`).join('')}` : ''}
      ${payments.length ? `<p class="command-label">Payments</p>${payments.map(payment => `<button class="command-result" data-command-payment="${payment.id}"><span>$</span><div><strong>${escapeHtml(paymentSourceLabel(payment))}</strong><small>${formatMoney(payment.amountCents || 0, activeBusiness().currency)} · ${escapeHtml(paymentMethodLabel(payment.method))} · ${formatDate(payment.receivedDate)}</small></div></button>`).join('')}` : ''}
      ${expenses.length ? `<p class="command-label">Expenses</p>${expenses.map(expense => `<button class="command-result" data-command-expense="${expense.id}"><span>−</span><div><strong>${escapeHtml(expense.merchant || 'Expense')}</strong><small>${formatMoney(expense.totalCents || 0, activeBusiness().currency)} · ${escapeHtml(expenseCategoryLabel(expense.category))} · ${formatDate(expense.date)}</small></div></button>`).join('')}` : ''}
      ${term && !navigation.length && !clients.length && !sessions.length && !invoices.length && !payments.length && !expenses.length ? `<div class="command-empty">No local records match “${escapeHtml(term)}”.</div>` : ''}`;
    $$('[data-command-view]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.commandView)));
    $$('[data-command-client]').forEach(btn => btn.addEventListener('click', () => { closeModal(); setView('work'); openClientDetail(btn.dataset.commandClient); }));
    $$('[data-command-session]').forEach(btn => btn.addEventListener('click', () => { closeModal(); setView('work'); openSessionDetail(btn.dataset.commandSession); }));
    $$('[data-command-invoice]').forEach(btn => btn.addEventListener('click', () => { closeModal(); setView('money'); openInvoiceDetail(btn.dataset.commandInvoice); }));
    $$('[data-command-payment]').forEach(btn => btn.addEventListener('click', () => { closeModal(); setView('money'); ui.moneyTab = 'payments'; syncMoneyTabs(); openPaymentDetail(btn.dataset.commandPayment); }));
    $$('[data-command-expense]').forEach(btn => btn.addEventListener('click', () => { closeModal(); setView('money'); ui.moneyTab = 'expenses'; syncMoneyTabs(); openExpenseDetail(btn.dataset.commandExpense); }));
  }

  function openClientForm(existingId = null) {
    $('#formSheet').classList.remove('session-form-sheet');
    const existing = existingId ? data.clients.find(c => c.id === existingId) : null;
    ui.formMode = 'client'; ui.formRecordId = existingId;
    $('#formEyebrow').textContent = existing ? 'EDIT CLIENT' : 'ADD CLIENT';
    $('#formTitle').textContent = existing ? existing.displayName : 'New client';
    $('#formSubmitBtn').textContent = existing ? 'Save changes' : 'Add client';
    const selectedColorKey = clientColorKey(existing || { colorKey: defaultClientColorForIndex(businessClients().length) });
    $('#formFields').innerHTML = `
      <label class="field"><span>Client / payer name</span><input name="displayName" required maxlength="100" placeholder="e.g. Client A" value="${escapeHtml(existing?.displayName || '')}" /><small>You can use an alias if you do not want identifying client information in the prototype.</small></label>
      <fieldset class="client-color-field"><legend>Client color</legend><div class="client-color-picker" role="radiogroup" aria-label="Client color">${CLIENT_COLOR_KEYS.map((key, index) => `<label class="client-color-option" title="${key[0].toUpperCase()+key.slice(1)}"><input type="radio" name="colorKey" value="${key}" ${selectedColorKey === key ? 'checked' : ''}/><span class="client-color-swatch client-bg-${key}" aria-hidden="true"></span><span class="sr-only">${key}</span></label>`).join('')}</div><small>Used as a quick visual identifier in work views.</small></fieldset>
      <div class="field-row"><label class="field"><span>Default hourly rate</span><div class="money-input"><span>$</span><input name="rate" required inputmode="decimal" min="0" step="0.01" type="number" placeholder="0.00" value="${existing ? (existing.defaultRateCents/100).toFixed(2) : ''}" /></div></label><label class="field"><span>Status</span><select name="status"><option value="active" ${existing?.status !== 'inactive' ? 'selected' : ''}>Active</option><option value="inactive" ${existing?.status === 'inactive' ? 'selected' : ''}>Inactive</option></select></label></div>
      <details class="optional-fields" ${existing?.billingEmail || existing?.billingAddress ? 'open' : ''}><summary>Billing details <span>optional</span></summary><div class="optional-fields-body"><label class="field"><span>Billing email</span><input name="billingEmail" type="email" maxlength="160" placeholder="payer@example.com" value="${escapeHtml(existing?.billingEmail || '')}" /></label><label class="field"><span>Billing address</span><textarea name="billingAddress" rows="2" maxlength="300" placeholder="Optional address shown on invoices">${escapeHtml(existing?.billingAddress || '')}</textarea></label></div></details>
      <label class="field"><span>Notes <em>optional</em></span><textarea name="notes" rows="3" maxlength="500" placeholder="Billing arrangement, general context, or reminder…">${escapeHtml(existing?.notes || '')}</textarea></label>`;
    openModal($('#formSheet'));
  }

  function openSessionForm(existingId = null) {
    const existing = existingId ? data.sessions.find(s => s.id === existingId) : null;
    if (existing?.invoiceId && invoiceById(existing.invoiceId)?.status === 'sent') {
      showToast('This session is on a sent invoice. Move that invoice back to Draft before editing it.');
      return;
    }
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
    const today = businessToday();
    const clientLocked = Boolean(existing?.invoiceId);
    $('#formSheet').classList.add('session-form-sheet');
    $('#formFields').innerHTML = `
      <label class="field"><span>Client</span><select ${clientLocked ? 'disabled' : 'name="clientId"'} id="sessionClient" required><option value="">Choose client</option>${clients.map(c => `<option value="${c.id}" data-rate="${c.defaultRateCents || 0}" ${c.id === existing?.clientId ? 'selected' : ''}>${escapeHtml(c.displayName)}</option>`).join('')}</select>${clientLocked ? `<input type="hidden" name="clientId" value="${escapeHtml(existing.clientId)}" /><small>Client is locked while this session is attached to ${escapeHtml(invoiceById(existing.invoiceId)?.number || 'an invoice')}. Edit the invoice first to move the session.</small>` : ''}</label>
      <div class="session-entry-grid">
        <div class="clock-picker" id="sessionClockPicker">
          <div class="clock-picker-head">
            <div><span class="clock-kicker">TIME</span><strong id="clockInstruction">Choose start time</strong></div>
            <div class="time-summary" aria-label="Selected times">
              <button type="button" class="time-chip active" data-clock-target="start"><small>Start</small><strong id="clockStartLabel">${clockTimeLabel(existing?.startTime)}</strong></button>
              <span class="time-summary-arrow">→</span>
              <button type="button" class="time-chip" data-clock-target="end"><small>End</small><strong id="clockEndLabel">${clockTimeLabel(existing?.endTime)}</strong></button>
            </div>
          </div>
          <input type="hidden" name="startTime" id="clockStartInput" value="${existing?.startTime || ''}" />
          <input type="hidden" name="endTime" id="clockEndInput" value="${existing?.endTime || ''}" />
          <div class="clock-dial-wrap">
            <div class="clock-dial" id="clockDial" role="slider" tabindex="0" aria-label="Choose start time" aria-valuetext="${clockTimeLabel(existing?.startTime)}">
              <div class="clock-ticks" id="clockTicks" aria-hidden="true"></div>
              <div class="clock-numbers" id="clockNumbers" aria-hidden="true"></div>
              <div class="clock-hand" id="clockHand"><span></span></div>
              <div class="clock-center">
                <small id="clockTargetLabel">START</small>
                <strong id="clockReadout">${clockTimeLabel(existing?.startTime) !== '—' ? clockTimeLabel(existing?.startTime) : clockTimeLabel(currentRoundedTime())}</strong>
              </div>
            </div>
          </div>
          <div class="clock-controls">
            <div class="period-toggle" aria-label="AM or PM">
              <button type="button" data-period="AM">AM</button><button type="button" data-period="PM">PM</button>
            </div>
            <div class="clock-stage-nav">
              <button type="button" class="clock-arrow" id="clockPrev" aria-label="Edit start time">←</button>
              <span id="clockStageText">Start time</span>
              <button type="button" class="clock-arrow" id="clockNext" aria-label="Edit end time">→</button>
            </div>
            <span class="clock-snap-note">Snaps to 5 min</span>
          </div>
          <div class="clock-duration" id="clockDuration">Select a start and end time</div>
        </div>
        <div class="session-meta-stack">
          <label class="field"><span>Date</span><input name="date" type="date" required value="${existing?.date || today}" /></label>
          <label class="field"><span>Hourly rate for this session</span><div class="money-input"><span>$</span><input name="rate" id="sessionRate" required inputmode="decimal" min="0" step="0.01" type="number" value="${existing ? (existing.rateCents/100).toFixed(2) : ''}" placeholder="0.00" /></div><small>The saved session keeps this rate even if the client rate changes later.</small></label>
          <label class="field session-note-field"><span>Session note <em>optional</em></span><textarea name="notes" rows="6" maxlength="500" placeholder="Brief work note or billing context…">${escapeHtml(existing?.notes || '')}</textarea></label>
        </div>
      </div>`;
    openModal($('#formSheet'));
    const select = $('#sessionClient');
    if (!existing && clients.length === 1) { select.value = clients[0].id; $('#sessionRate').value = (clients[0].defaultRateCents/100).toFixed(2); }
    select.addEventListener('change', () => { const option = select.selectedOptions[0]; if (option?.dataset.rate) $('#sessionRate').value = (Number(option.dataset.rate)/100).toFixed(2); });
    initClockTimePicker(existing?.startTime || '', existing?.endTime || '');
  }

  function initClockTimePicker(initialStart = '', initialEnd = '') {
    const dial = $('#clockDial'); if (!dial) return;
    const startInput = $('#clockStartInput'), endInput = $('#clockEndInput');
    const startLabel = $('#clockStartLabel'), endLabel = $('#clockEndLabel');
    const readout = $('#clockReadout'), targetLabel = $('#clockTargetLabel'), instruction = $('#clockInstruction');
    const hand = $('#clockHand'), duration = $('#clockDuration'), stageText = $('#clockStageText');
    const ticks = $('#clockTicks'), numbers = $('#clockNumbers');
    let target = initialStart && !initialEnd ? 'end' : 'start';
    let previewTime = target === 'start' ? (initialStart || currentRoundedTime()) : (initialEnd || initialStart || currentRoundedTime());
    let periodExplicit = { start: Boolean(initialStart), end: Boolean(initialEnd) };
    let dragging = false;

    ticks.innerHTML = Array.from({length:144}, (_, i) => {
      const angleDeg = i * 2.5;
      const angle = angleDeg * Math.PI / 180;
      const x = 50 + 45.5 * Math.sin(angle), y = 50 - 45.5 * Math.cos(angle);
      return `<span class="clock-tick ${i % 12 === 0 ? 'hour' : i % 3 === 0 ? 'quarter' : ''}" style="left:${x}%;top:${y}%;transform:translate(-50%,-50%) rotate(${angleDeg}deg)"></span>`;
    }).join('');
    numbers.innerHTML = Array.from({length:12}, (_, i) => {
      const hour = i === 0 ? 12 : i;
      const angle = i * 30 * Math.PI / 180;
      const x = 50 + 39 * Math.sin(angle), y = 50 - 39 * Math.cos(angle);
      return `<span style="left:${x}%;top:${y}%">${hour}</span>`;
    }).join('');

    const activeInput = () => target === 'start' ? startInput : endInput;
    const selectedValue = () => activeInput().value || previewTime || currentRoundedTime();
    const periodFor = (value) => (timeToMinutes(value) ?? 0) >= 720 ? 'PM' : 'AM';

    function setTarget(next) {
      target = next;
      const value = activeInput().value;
      previewTime = value || (target === 'end' ? (startInput.value ? addMinutesToTime(startInput.value, 60) : currentRoundedTime()) : currentRoundedTime());
      $$('.time-chip', $('#sessionClockPicker')).forEach(btn => btn.classList.toggle('active', btn.dataset.clockTarget === target));
      targetLabel.textContent = target.toUpperCase();
      instruction.textContent = target === 'start' ? 'Choose start time' : 'Choose end time';
      stageText.textContent = target === 'start' ? 'Start time' : 'End time';
      dial.setAttribute('aria-label', instruction.textContent);
      renderDial();
    }

    function inferEndPeriod(minutes12) {
      const start = timeToMinutes(startInput.value);
      if (start == null) return periodFor(previewTime);
      const candidates = [minutes12, minutes12 + 720];
      let best = null;
      for (const candidate of candidates) {
        let delta = candidate - start;
        if (delta <= 0) delta += 1440;
        if (best === null || delta < best.delta) best = { value: candidate % 1440, delta };
      }
      return best.value >= 720 ? 'PM' : 'AM';
    }

    function composeTime(minutes12, period, isEnd = false) {
      let normalized12 = ((minutes12 % 720) + 720) % 720;
      let chosenPeriod = period;
      if (isEnd && !periodExplicit.end) chosenPeriod = inferEndPeriod(normalized12);
      return minutesToTime(normalized12 + (chosenPeriod === 'PM' ? 720 : 0));
    }

    function renderDial() {
      const value = selectedValue();
      const total = timeToMinutes(value) ?? 0;
      const within12 = total % 720;
      const angle = (within12 / 720) * 360;
      hand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
      readout.textContent = clockTimeLabel(value);
      dial.setAttribute('aria-valuetext', clockTimeLabel(value));
      $$('[data-period]', $('#sessionClockPicker')).forEach(btn => btn.classList.toggle('active', btn.dataset.period === periodFor(value)));
      startLabel.textContent = clockTimeLabel(startInput.value);
      endLabel.textContent = clockTimeLabel(endInput.value);
      if (startInput.value && endInput.value) {
        const mins = minutesBetween(startInput.value, endInput.value);
        duration.textContent = mins ? `${hoursLabel(mins)} session · ${clockTimeLabel(startInput.value)} → ${clockTimeLabel(endInput.value)}` : 'Start and end cannot be identical';
        duration.classList.toggle('ready', Boolean(mins));
      } else {
        duration.textContent = target === 'start' ? 'Select a start time, then choose the end.' : 'Now select the end time.';
        duration.classList.remove('ready');
      }
    }

    function timeFromPointer(event) {
      const rect = dial.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      let angle = Math.atan2(x, -y) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      const minutes12 = Math.round(((angle / 360) * 720) / 5) * 5 % 720;
      const currentPeriod = periodFor(selectedValue());
      return composeTime(minutes12, currentPeriod, target === 'end');
    }

    function previewFromPointer(event) {
      previewTime = timeFromPointer(event);
      renderDial();
    }

    function commitSelection() {
      activeInput().value = previewTime;
      if (target === 'start') {
        periodExplicit.start = true;
        renderDial();
        setTimeout(() => setTarget('end'), 90);
      } else {
        renderDial();
      }
    }

    dial.addEventListener('pointerdown', event => {
      dragging = true;
      dial.setPointerCapture?.(event.pointerId);
      previewFromPointer(event);
    });
    dial.addEventListener('pointermove', event => { if (dragging) previewFromPointer(event); });
    dial.addEventListener('pointerup', event => {
      if (!dragging) return;
      dragging = false;
      previewFromPointer(event);
      commitSelection();
    });
    dial.addEventListener('pointercancel', () => { dragging = false; });
    dial.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter',' '].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Enter' || event.key === ' ') { activeInput().value = previewTime; if (target === 'start') setTarget('end'); renderDial(); return; }
      const delta = event.key === 'ArrowLeft' ? -5 : event.key === 'ArrowRight' ? 5 : event.key === 'ArrowUp' ? 60 : -60;
      previewTime = addMinutesToTime(selectedValue(), delta);
      renderDial();
    });

    $$('[data-clock-target]', $('#sessionClockPicker')).forEach(btn => btn.addEventListener('click', () => setTarget(btn.dataset.clockTarget)));
    $('#clockPrev').addEventListener('click', () => setTarget('start'));
    $('#clockNext').addEventListener('click', () => setTarget('end'));
    $$('[data-period]', $('#sessionClockPicker')).forEach(btn => btn.addEventListener('click', () => {
      periodExplicit[target] = true;
      const current = selectedValue();
      const minutes = timeToMinutes(current) ?? 0;
      const within12 = minutes % 720;
      previewTime = minutesToTime(within12 + (btn.dataset.period === 'PM' ? 720 : 0));
      if (activeInput().value) activeInput().value = previewTime;
      renderDial();
    }));

    setTarget(target);
  }

  function openBusinessForm() {
    $('#formSheet').classList.remove('session-form-sheet');
    ui.formMode = 'business'; ui.formRecordId = null;
    $('#formEyebrow').textContent = 'NEW WORKSPACE'; $('#formTitle').textContent = 'Add business or gig'; $('#formSubmitBtn').textContent = 'Create workspace';
    $('#formFields').innerHTML = `
      <label class="field"><span>Display name</span><input name="displayName" required maxlength="100" placeholder="Business or gig name" /></label>
      <label class="field"><span>Type</span><select name="entityType"><option>Sole proprietor</option><option>Independent gig</option><option>Other business</option></select></label>
      <label class="field"><span>Timezone</span><input name="timezone" value="America/Los_Angeles" required /></label>`;
    openModal($('#formSheet'));
  }

  function openInvoiceSettingsForm() {
    $('#formSheet').classList.remove('session-form-sheet');
    ui.formMode = 'invoice-settings'; ui.formRecordId = activeBusiness().id;
    const business = activeBusiness();
    const settings = { ...invoiceDefaults(), ...(business.invoiceSettings || {}) };
    $('#formEyebrow').textContent = 'INVOICE SETTINGS';
    $('#formTitle').textContent = 'Identity & defaults';
    $('#formSubmitBtn').textContent = 'Save settings';
    $('#formFields').innerHTML = `
      <label class="field"><span>Business / sender name</span><input name="legalName" required maxlength="120" value="${escapeHtml(business.legalName || business.displayName)}" /></label>
      <div class="field-row"><label class="field"><span>Invoice prefix</span><input name="prefix" maxlength="12" value="${escapeHtml(settings.prefix || 'INV')}" /></label><label class="field"><span>Default due days</span><input name="defaultDueDays" type="number" min="0" max="365" step="1" value="${Number(settings.defaultDueDays ?? 7)}" /></label></div>
      <details class="optional-fields" ${settings.senderEmail || settings.senderPhone || settings.senderAddress || settings.paymentInstructions ? 'open' : ''}><summary>Invoice contact & payment details <span>optional</span></summary><div class="optional-fields-body"><div class="field-row"><label class="field"><span>Email</span><input name="senderEmail" type="email" maxlength="160" value="${escapeHtml(settings.senderEmail || '')}" placeholder="business@example.com" /></label><label class="field"><span>Phone</span><input name="senderPhone" maxlength="50" value="${escapeHtml(settings.senderPhone || '')}" placeholder="Optional" /></label></div><label class="field"><span>Business address</span><textarea name="senderAddress" rows="2" maxlength="300" placeholder="Optional address shown on invoices">${escapeHtml(settings.senderAddress || '')}</textarea></label><label class="field"><span>Payment instructions</span><textarea name="paymentInstructions" rows="3" maxlength="500" placeholder="e.g. Payment method or brief instructions">${escapeHtml(settings.paymentInstructions || '')}</textarea></label></div></details>
      <div class="form-info-note">Next invoice number: <strong>${escapeHtml(invoiceNumberPreview(business))}</strong>. Numbers are never reused after an invoice is created.</div>`;
    openModal($('#formSheet'));
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (ui.formMode === 'payment') {
      if (!savePayment(form)) return;
      const paymentId = ui.formRecordId;
      ui.moneyTab = 'payments';
      closeModal(); renderAll(); setView('money');
      if (paymentId) setTimeout(() => openPaymentDetail(paymentId), 35);
      return;
    }
    if (ui.formMode === 'expense') {
      if (!(await saveExpense(form))) return;
      const expenseId = ui.formRecordId;
      ui.moneyTab = 'expenses'; ui.expensePage = 1;
      closeModal(); renderAll(); setView('money'); syncMoneyTabs();
      if (expenseId) setTimeout(() => openExpenseDetail(expenseId), 35);
      return;
    }
    if (ui.formMode === 'client') {
      const payload = { displayName: form.get('displayName').trim(), colorKey: CLIENT_COLOR_KEYS.includes(form.get('colorKey')) ? form.get('colorKey') : 'blue', defaultRateCents: Math.round(Number(form.get('rate')) * 100), status: form.get('status'), billingEmail: (form.get('billingEmail') || '').trim(), billingAddress: (form.get('billingAddress') || '').trim(), notes: form.get('notes').trim() };
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
      if (!startTime || !endTime) { showToast('Choose both a start and end time on the clock.'); return; }
      if (!durationMinutes) { showToast('Start and end time cannot be identical.'); return; }
      const selectedClient = clientById(form.get('clientId'));
      const payload = { clientId: form.get('clientId'), clientNameSnapshot: selectedClient?.displayName || '', date: form.get('date'), startTime, endTime, durationMinutes, rateCents: Math.round(Number(form.get('rate')) * 100), notes: form.get('notes').trim() };
      if (ui.formRecordId) {
        const session = data.sessions.find(s => s.id === ui.formRecordId); const before = deepClone(session);
        const linkedInvoice = session?.invoiceId ? invoiceById(session.invoiceId) : null;
        if (linkedInvoice?.status === 'sent') { showToast('Move the linked invoice back to Draft before changing this session.'); return; }
        Object.assign(session, payload, { updatedAt: nowIso() });
        if (linkedInvoice?.status === 'draft') {
          const lineIndex = linkedInvoice.lineItems.findIndex(item => item.type === 'session' && item.sessionId === session.id);
          if (lineIndex >= 0) linkedInvoice.lineItems[lineIndex] = invoiceSessionLine(session, linkedInvoice.lineItems[lineIndex].id);
          linkedInvoice.updatedAt = nowIso();
          data.auditEvents.push({ id: uid('audit'), businessId: data.activeBusinessId, eventType: 'source_session_updated', entityType: 'Invoice', entityId: linkedInvoice.id, details: { sessionId: session.id }, occurredAt: nowIso() });
        }
        persist('updated', 'WorkSession', session.id, { before, after: deepClone(session) }); showToast('Work session updated');
      } else {
        const session = { id: uid('session'), businessId: data.activeBusinessId, ...payload, invoiceStatus: 'uninvoiced', invoiceId: null, createdAt: nowIso(), updatedAt: nowIso() };
        data.sessions.push(session); ui.sessionPage = 1; persist('created', 'WorkSession', session.id); showToast('Work session logged');
      }
    }
    if (ui.formMode === 'invoice-settings') {
      const business = activeBusiness();
      const before = deepClone(business);
      business.legalName = form.get('legalName').trim();
      business.invoiceSettings = { ...invoiceDefaults(), ...(business.invoiceSettings || {}), prefix: (form.get('prefix') || 'INV').trim().toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,12) || 'INV', defaultDueDays: Math.max(0, Math.min(365, Number(form.get('defaultDueDays') || 0))), senderEmail: (form.get('senderEmail') || '').trim(), senderPhone: (form.get('senderPhone') || '').trim(), senderAddress: (form.get('senderAddress') || '').trim(), paymentInstructions: (form.get('paymentInstructions') || '').trim() };
      business.updatedAt = nowIso();
      persist('updated', 'BusinessInvoiceSettings', business.id, { before, after: deepClone(business) });
      showToast('Invoice settings saved');
    }
    if (ui.formMode === 'business') {
      const business = { id: uid('biz'), displayName: form.get('displayName').trim(), legalName: form.get('displayName').trim(), entityType: form.get('entityType'), currency: 'USD', timezone: form.get('timezone').trim(), status: 'active', invoiceSettings: invoiceDefaults(), createdAt: nowIso(), updatedAt: nowIso() };
      data.businesses.push(business); data.activeBusinessId = business.id; persist('created', 'Business', business.id); showToast('Workspace created');
    }
    const completedMode = ui.formMode;
    closeModal(); renderAll(); setView(completedMode === 'business' ? 'home' : completedMode === 'invoice-settings' ? 'money' : 'work');
  }

  function applyClientDetailTheme(client) {
    const panel = $('#detailPanel');
    if (!panel) return;
    panel.classList.add('client-tinted-detail');
    panel.dataset.clientColor = clientColorKey(client);
  }

  function resetDetailPanelTheme() {
    const panel = $('#detailPanel');
    if (!panel) return;
    panel.classList.remove('client-tinted-detail');
    delete panel.dataset.clientColor;
  }

  function openClientDetail(id) {
    const client = data.clients.find(c => c.id === id); if (!client) return;
    const sessions = data.sessions.filter(s => s.clientId === id).sort((a,b) => b.date.localeCompare(a.date));
    const minutes = sessions.reduce((sum,s) => sum + sessionMinutes(s), 0);
    $('#detailEyebrow').textContent = 'CLIENT'; $('#detailTitle').textContent = client.displayName;
    $('#detailBody').innerHTML = `<div class="detail-actions"><button class="secondary-btn" data-edit-client="${client.id}">Edit</button><button class="primary-btn" data-new-session-client="${client.id}">＋ Log session</button><details class="record-more"><summary aria-label="More client actions" title="More actions">•••</summary><div class="record-more-popover"><button type="button" class="danger-menu-item" data-delete-client="${client.id}">Delete client</button></div></details></div><div id="detailDeleteConfirm"></div>
      <div class="detail-metrics"><div><small>Default rate</small><strong>${formatMoney(client.defaultRateCents || 0)}/hr</strong></div><div><small>Sessions</small><strong>${sessions.length}</strong></div><div><small>Hours logged</small><strong>${hoursLabel(minutes)}</strong></div></div>
      <div class="detail-section"><p class="eyebrow">NOTES</p><p>${escapeHtml(client.notes || 'No client notes yet.')}</p></div>
      <div class="detail-section"><div class="panel-title-row"><p class="eyebrow">RECENT SESSIONS</p></div>${sessions.length ? `<div class="recent-list">${sessions.slice(0,5).map(sessionRowCompact).join('')}</div>` : '<div class="inline-empty"><small>No sessions for this client yet.</small></div>'}</div>`;
    openModal($('#detailPanel'));
    applyClientDetailTheme(client);
    $('[data-edit-client]')?.addEventListener('click', () => openClientForm(id));
    $('[data-new-session-client]')?.addEventListener('click', () => { closeModal(); openSessionForm(); setTimeout(() => { $('#sessionClient').value = id; $('#sessionRate').value = (client.defaultRateCents/100).toFixed(2); }, 20); });
    $('[data-delete-client]')?.addEventListener('click', () => showDeleteConfirmation('client', id));
    $$('[data-session-detail]', $('#detailBody')).forEach(btn => btn.addEventListener('click', () => openSessionDetail(btn.dataset.sessionDetail)));
  }

  function openSessionDetail(id) {
    const s = data.sessions.find(session => session.id === id); if (!s) return;
    const client = clientById(s.clientId);
    const linkedInvoice = s.invoiceId ? invoiceById(s.invoiceId) : null;
    const clientLabel = client?.displayName || s.clientNameSnapshot || 'Unassigned session';
    const invoiceAction = linkedInvoice
      ? `<button class="primary-btn" data-view-linked-invoice="${linkedInvoice.id}">View ${escapeHtml(linkedInvoice.number)}</button>`
      : `<button class="primary-btn" data-create-invoice-session="${s.id}">Create invoice</button>`;
    const editButton = linkedInvoice?.status === 'sent'
      ? `<button class="secondary-btn disabled-action" title="Move the linked invoice back to Draft before editing">Edit session</button>`
      : `<button class="secondary-btn" data-edit-session="${s.id}">Edit session</button>`;
    $('#detailEyebrow').textContent = 'WORK SESSION'; $('#detailTitle').textContent = clientLabel;
    $('#detailBody').innerHTML = `<div class="detail-actions">${editButton}${invoiceAction}<details class="record-more"><summary aria-label="More session actions" title="More actions">•••</summary><div class="record-more-popover"><button type="button" class="danger-menu-item" data-delete-session="${s.id}">Delete session</button></div></details></div><div id="detailDeleteConfirm"></div>
      <div class="detail-metrics"><div><small>Date</small><strong>${formatDate(s.date,{month:'short',day:'numeric',year:'numeric'})}</strong></div><div><small>Time</small><strong>${escapeHtml(sessionTimeRangeLabel(s))}</strong></div><div><small>Duration</small><strong>${hoursLabel(sessionMinutes(s))}</strong></div></div>
      <div class="detail-section"><div class="trace-row"><span>Session value</span><strong>${formatMoney(sessionAmountCents(s), activeBusiness().currency)}</strong></div><div class="trace-row"><span>Rate snapshot</span><strong>${formatMoney(s.rateCents || 0)}/hr</strong></div><div class="trace-row"><span>Invoice state</span><strong>${escapeHtml(sessionInvoiceStatusLabel(s))}${linkedInvoice ? ` · ${escapeHtml(linkedInvoice.number)}` : ''}</strong></div></div>
      <div class="detail-section"><p class="eyebrow">SESSION NOTE</p><p>${escapeHtml(s.notes || 'No session note.')}</p></div>
      <div class="trace-banner"><span>↳</span><div><strong>${linkedInvoice ? 'Linked financial record' : 'Ready for invoicing'}</strong><small>${linkedInvoice ? `This session is linked to ${escapeHtml(linkedInvoice.number)}. Invoice snapshots protect the issued billing record from silent changes.` : 'Create an invoice from this session without re-entering the client, hours, or rate.'}</small></div></div>`;
    openModal($('#detailPanel'));
    $('[data-edit-session]')?.addEventListener('click', () => openSessionForm(id));
    $('[data-create-invoice-session]')?.addEventListener('click', () => openInvoiceForm({ clientId: s.clientId, sessionId: s.id }));
    $('[data-view-linked-invoice]')?.addEventListener('click', () => { closeModal(); setView('money'); setTimeout(() => openInvoiceDetail(linkedInvoice.id), 20); });
    $('[data-delete-session]')?.addEventListener('click', () => showDeleteConfirmation('session', id));
  }

  function showDeleteConfirmation(type, id) {
    const host = $('#detailDeleteConfirm');
    if (!host) return;
    $('.record-more[open]', $('#detailBody'))?.removeAttribute('open');
    if (type === 'session') {
      const session = data.sessions.find(item => item.id === id);
      if (!session) return;
      const client = clientById(session.clientId);
      const linkedInvoice = session.invoiceId ? invoiceById(session.invoiceId) : null;
      if (linkedInvoice?.status === 'sent') {
        host.innerHTML = `<div class="delete-confirm-card blocked"><div><strong>Session is locked by ${escapeHtml(linkedInvoice.number)}</strong><p>This work session is part of a sent invoice. Move the invoice back to Draft or void it before deleting the source session.</p></div><div class="delete-confirm-actions"><button type="button" class="secondary-btn" data-cancel-delete>Close</button><button type="button" class="primary-btn" data-open-blocking-invoice>View invoice</button></div></div>`;
        $('[data-open-blocking-invoice]', host)?.addEventListener('click', () => { closeModal(); setView('money'); setTimeout(() => openInvoiceDetail(linkedInvoice.id), 20); });
      } else {
        const draftWarning = linkedInvoice?.status === 'draft' ? ` It will also be removed from draft invoice ${linkedInvoice.number}.` : '';
        host.innerHTML = `<div class="delete-confirm-card"><div><strong>Delete this session?</strong><p>${escapeHtml(formatDate(session.date,{month:'short',day:'numeric',year:'numeric'}))} · ${escapeHtml(sessionTimeRangeLabel(session))}${client ? ` · ${escapeHtml(client.displayName)}` : ''} will be permanently removed.${escapeHtml(draftWarning)} This cannot be undone.</p></div><div class="delete-confirm-actions"><button type="button" class="secondary-btn" data-cancel-delete>Cancel</button><button type="button" class="danger-btn" data-confirm-delete>Delete session</button></div></div>`;
      }
    } else {
      const client = data.clients.find(item => item.id === id);
      if (!client) return;
      const activeInvoices = businessInvoices().filter(invoice => invoice.clientId === id && invoice.status !== 'void');
      if (activeInvoices.length) {
        host.innerHTML = `<div class="delete-confirm-card blocked"><div><strong>Client has active invoice records</strong><p>${escapeHtml(client.displayName)} is referenced by ${activeInvoices.length} ${activeInvoices.length === 1 ? 'invoice' : 'invoices'}. Delete drafts or void issued invoices first, or keep the client as Inactive.</p></div><div class="delete-confirm-actions"><button type="button" class="secondary-btn" data-cancel-delete>Close</button><button type="button" class="primary-btn" data-go-client-invoices>View invoices</button></div></div>`;
        $('[data-go-client-invoices]', host)?.addEventListener('click', () => { closeModal(); setView('money'); });
      } else {
        const linkedSessions = data.sessions.filter(session => session.clientId === id);
        const sessionWarning = linkedSessions.length ? ` This will also permanently delete ${linkedSessions.length} linked work ${linkedSessions.length === 1 ? 'session' : 'sessions'}.` : '';
        host.innerHTML = `<div class="delete-confirm-card"><div><strong>Delete ${escapeHtml(client.displayName)}?</strong><p>The client will be permanently removed.${sessionWarning} Voided invoice snapshots, if any, remain preserved. This cannot be undone.</p></div><div class="delete-confirm-actions"><button type="button" class="secondary-btn" data-cancel-delete>Cancel</button><button type="button" class="danger-btn" data-confirm-delete>Delete client</button></div></div>`;
      }
    }
    host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('[data-cancel-delete]', host)?.addEventListener('click', () => { host.innerHTML = ''; });
    $('[data-confirm-delete]', host)?.addEventListener('click', () => deleteRecord(type, id));
  }

  function deleteRecord(type, id) {
    if (type === 'session') {
      const session = data.sessions.find(item => item.id === id);
      if (!session) return;
      const linkedInvoice = session.invoiceId ? invoiceById(session.invoiceId) : null;
      if (linkedInvoice?.status === 'sent') { showToast('Sent invoice records must be unlocked before deleting this session.'); return; }
      if (linkedInvoice?.status === 'draft') {
        linkedInvoice.lineItems = linkedInvoice.lineItems.filter(item => !(item.type === 'session' && item.sessionId === id));
        linkedInvoice.updatedAt = nowIso();
        data.auditEvents.push({ id: uid('audit'), businessId: data.activeBusinessId, eventType: 'source_session_deleted', entityType: 'Invoice', entityId: linkedInvoice.id, details: { sessionId: id }, occurredAt: nowIso() });
      }
      data.sessions = data.sessions.filter(item => item.id !== id);
      data.expenses.filter(expense => expense.sessionId === id).forEach(expense => { expense.sessionId = null; expense.updatedAt = nowIso(); });
      data.auditEvents = data.auditEvents.filter(event => event.entityId !== id);
      data.auditEvents.push({ id: uid('audit'), businessId: data.activeBusinessId, eventType: 'deleted', entityType: 'WorkSession', entityId: id, details: { removedFromDraftInvoice: linkedInvoice?.number || null }, occurredAt: nowIso() });
      repository.save(data);
      closeModal(); renderAll(); showToast(linkedInvoice ? `Session deleted and removed from ${linkedInvoice.number}` : 'Work session deleted');
      return;
    }

    const client = data.clients.find(item => item.id === id);
    if (!client) return;
    if (businessInvoices().some(invoice => invoice.clientId === id && invoice.status !== 'void')) { showToast('Resolve this client’s active invoices before deleting the client.'); return; }
    const linkedSessionIds = data.sessions.filter(session => session.clientId === id).map(session => session.id);
    const deletedIds = new Set([id, ...linkedSessionIds]);
    data.clients = data.clients.filter(item => item.id !== id);
    data.expenses.filter(expense => expense.clientId === id).forEach(expense => { expense.clientNameSnapshot ||= client.displayName; expense.clientId = null; if (linkedSessionIds.includes(expense.sessionId)) expense.sessionId = null; expense.updatedAt = nowIso(); });
    data.sessions = data.sessions.filter(session => session.clientId !== id);
    data.auditEvents = data.auditEvents.filter(event => !deletedIds.has(event.entityId));
    data.auditEvents.push({ id: uid('audit'), businessId: data.activeBusinessId, eventType: 'deleted', entityType: 'Client', entityId: id, details: { cascadedSessionCount: linkedSessionIds.length }, occurredAt: nowIso() });
    repository.save(data);
    closeModal(); renderAll();
    showToast(linkedSessionIds.length ? `Client and ${linkedSessionIds.length} linked ${linkedSessionIds.length === 1 ? 'session' : 'sessions'} deleted` : 'Client deleted');
  }

  function exportBackup() {
    const blob = new Blob([repository.export(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `business-ledger-backup-${businessToday()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0); showToast('Local backup exported');
  }

  function renderAll() {
    renderWorkspaceChrome(); renderWorkspaceOptions(); renderHome(); renderWork(); renderMoney(); renderRecords(); syncMoneyTabs(); renderCommandPalette();
  }


  window.addEventListener('pointermove', event => queueAtriumMotion(event.clientX, event.clientY), { passive:true });
  window.addEventListener('resize', () => {
    applyAtriumRuntimeProfile();
    queueAtriumMotion(window.innerWidth / 2, window.innerHeight / 2);
  }, { passive:true });
  prefersReducedMotion.addEventListener?.('change', () => {
    if (prefersReducedMotion.matches) { atriumPointerX = 0; atriumPointerY = 0; }
    applyAtriumRuntimeProfile();
    commitAtriumMotion();
  });

  sidebarCollapseBtn?.addEventListener('click', () => {
    applySidebarCollapsed(!appShell.classList.contains('sidebar-collapsed'));
  });
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
    if (btn.dataset.action === 'add-invoice') { closeModal(); openInvoiceForm(); return; }
    if (btn.dataset.action === 'add-payment') { closeModal(); openPaymentForm(); return; }
    if (btn.dataset.action === 'add-expense') { closeModal(); openExpenseForm(); return; }
    showToast(`${$('strong', btn).textContent} activates in its roadmap phase.`);
  }));

  $$('[data-work-tab]').forEach(btn => btn.addEventListener('click', () => {
    ui.workTab = btn.dataset.workTab;
    $$('[data-work-tab]').forEach(b => b.classList.toggle('active', b === btn));
    $$('[data-work-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.workPanel === ui.workTab));
  }));
  $('#sessionSearch').addEventListener('input', () => { ui.sessionPage = 1; renderSessions(); });
  $('#clientSearch').addEventListener('input', renderClients);
  $('#sessionFilterBtn').addEventListener('click', event => openFilterMenu(event.currentTarget, [
    { value:'all', label:'All sessions' },
    { value:'uninvoiced', label:'Uninvoiced' },
    { value:'linked', label:'In invoice' }
  ], ui.sessionFilter, value => { ui.sessionFilter = value; ui.sessionPage = 1; renderSessions(); }));
  $('#clientFilterBtn').addEventListener('click', event => openFilterMenu(event.currentTarget, [
    { value:'active', label:'Active' },
    { value:'inactive', label:'Inactive' },
    { value:'all', label:'All clients' }
  ], ui.clientFilter, value => { ui.clientFilter = value; renderClients(); }));
  $$('[data-money-tab]').forEach(btn => btn.addEventListener('click', () => { closeFilterMenu(); ui.moneyTab = btn.dataset.moneyTab; syncMoneyTabs(); }));
  $('#addInvoiceBtn').addEventListener('click', () => openInvoiceForm());
  $('#addPaymentBtn').addEventListener('click', () => openPaymentForm());
  $('#addExpenseBtn').addEventListener('click', () => openExpenseForm());
  $('#invoiceSettingsBtn').addEventListener('click', () => openInvoiceSettingsForm());
  $('#invoiceSettingsFromSettings').addEventListener('click', () => { closeModal(); openInvoiceSettingsForm(); });
  $('#invoiceFilterBtn').addEventListener('click', event => openFilterMenu(event.currentTarget, [
    { value:'all', label:'All invoices' },
    { value:'draft', label:'Draft' },
    { value:'sent', label:'Sent' },
    { value:'partially_paid', label:'Partially paid' },
    { value:'paid', label:'Paid' },
    { value:'overdue', label:'Overdue' },
    { value:'void', label:'Void' }
  ], ui.invoiceFilter, value => { ui.invoiceFilter = value; ui.invoicePage = 1; renderMoney(); }));
  $('#paymentFilterBtn').addEventListener('click', event => openFilterMenu(event.currentTarget, [
    { value:'all', label:'All payments' },
    { value:'invoice', label:'Invoice payments' },
    { value:'direct', label:'Other income' }
  ], ui.paymentFilter, value => { ui.paymentFilter = value; ui.paymentPage = 1; renderMoney(); }));
  $('#expenseFilterBtn').addEventListener('click', event => openFilterMenu(event.currentTarget, [
    { value:'all', label:'All expenses' },
    { value:'business', label:'Business' },
    { value:'mixed', label:'Mixed' },
    { value:'personal', label:'Personal' },
    { value:'needs_review', label:'Needs review' }
  ], ui.expenseFilter, value => { ui.expenseFilter = value; ui.expensePage = 1; renderMoney(); }));
  $('#receiptSearch').addEventListener('input', renderRecords);
  $('#invoiceForm').addEventListener('submit', saveInvoice);
  $('#invoiceClient').addEventListener('change', event => { renderInvoiceSessionChoices(event.target.value, new Set()); updateInvoiceDraftTotal(); });
  $('#invoiceIssueDate').addEventListener('change', event => {
    if (!ui.invoiceFormId) $('#invoiceDueDate').value = addDays(event.target.value, activeBusiness().invoiceSettings?.defaultDueDays ?? 7);
  });
  $('#addManualInvoiceLine').addEventListener('click', () => addManualInvoiceRow());
  $('#selectAllInvoiceSessions').addEventListener('click', () => {
    $$('input[name="invoiceSession"]', $('#invoiceSessionChoices')).forEach(input => { input.checked = true; });
    updateInvoiceDraftTotal();
    updateInvoiceSelectionActions();
  });
  $('#clearInvoiceSessions').addEventListener('click', () => {
    $$('input[name="invoiceSession"]', $('#invoiceSessionChoices')).forEach(input => { input.checked = false; });
    updateInvoiceDraftTotal();
    updateInvoiceSelectionActions();
  });
  $('#commandInput').addEventListener('input', renderCommandPalette);

  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); $('#commandInput').value = ''; renderCommandPalette(); openModal($('#commandPalette')); }
    if (event.key === 'Escape' && activeFilterMenu) { closeFilterMenu(); return; }
    if (event.key === 'Escape' && ui.modal) closeModal();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ui.activeView === 'home') startHomeRecentRotation();
  });

  applyAtriumRuntimeProfile();
  applyHomeAtriumState('home');
  commitAtriumMotion();
  renderAll();
})();
