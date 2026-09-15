const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function elementStub() {
  return {
    value: '', textContent: '', innerHTML: '', hidden: false, dataset: {},
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, setAttribute() {}, removeAttribute() {}, focus() {},
    matches() { return false; }, contains() { return false; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    getBoundingClientRect() { return { height: 1, width: 1 }; }, scrollIntoView() {}
  };
}

function boot(seed) {
  const elements = new Map();
  const one = selector => {
    if (!elements.has(selector)) elements.set(selector, elementStub());
    return elements.get(selector);
  };
  const store = new Map([['business-ledger:v0.2', JSON.stringify(seed)]]);
  const document = {
    querySelector: one, querySelectorAll: () => [], addEventListener() {}, hidden: false,
    activeElement: { tagName: 'BODY' }, body: one('body'), documentElement: one('html'),
    createElement: elementStub
  };
  const window = {
    innerWidth: 1280, innerHeight: 900, addEventListener() {}, scrollTo() {}, open() { return null; },
    matchMedia: () => ({ matches: false, addEventListener() {} })
  };
  const context = {
    console, document, window, navigator: { userAgent: 'Node', platform: 'Linux', maxTouchPoints: 0 },
    localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) },
    requestAnimationFrame: callback => { callback(); return 1; },
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    structuredClone, Blob, URL, Intl, Date, Math, JSON, Number, String, Map, Set, Array, Object, Boolean, Promise, Error
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), context, { filename: 'app.js' });
  return { elements, store };
}

const now = '2026-09-15T12:00:00Z';
const business = { id: 'biz', displayName: 'Play It Forward', entityType: 'Sole proprietor', currency: 'USD', timezone: 'America/Los_Angeles', status: 'active', invoiceSettings: { prefix: 'INV', nextNumber: 2, defaultDueDays: 7 }, createdAt: now, updatedAt: now };
const seed = {
  schemaVersion: 9, activeBusinessId: 'biz', businesses: [business],
  clients: [{ id: 'client', businessId: 'biz', displayName: 'Client One', status: 'active', defaultRateCents: 5000, colorKey: 'blue' }],
  sessions: [{ id: 'session', businessId: 'biz', clientId: 'client', clientNameSnapshot: 'Client One', date: '2026-09-10', startTime: '10:00', endTime: '12:00', rateCents: 5000, invoiceStatus: 'invoiced', invoiceId: 'invoice' }],
  invoices: [{ id: 'invoice', businessId: 'biz', number: 'INV-1', clientId: 'client', recipientSnapshot: { displayName: 'Client One' }, issueDate: '2026-09-10', dueDate: '2026-09-20', status: 'sent', lineItems: [{ type: 'session', sessionId: 'session', description: 'Work', quantityMinutes: 120, rateCents: 5000, amountCents: 10000 }] }],
  payments: [
    { id: 'payment', businessId: 'biz', kind: 'invoice', invoiceId: 'invoice', invoiceNumberSnapshot: 'INV-1', clientNameSnapshot: 'Client One', receivedDate: '2026-09-12', amountCents: 6000, method: 'zelle' },
    { id: 'prior-payment', businessId: 'biz', kind: 'direct', sourceName: 'Prior-period income', receivedDate: '2026-03-10', amountCents: 3000, method: 'zelle' }
  ],
  expenses: [{ id: 'expense', businessId: 'biz', merchant: 'Store', date: '2026-09-13', totalCents: 2000, businessCents: 1500, category: 'supplies', classification: 'mixed', reviewStatus: 'ready' }],
  receipts: [], vehicles: [], mileageTrips: [], auditEvents: [], evidenceSnapshots: []
};

const { elements, store } = boot(seed);
const html = selector => elements.get(selector)?.innerHTML || '';

assert.equal(JSON.parse(store.get('business-ledger:v0.2')).schemaVersion, 9);
assert.match(html('#analyticsKpis'), /\$60/);
assert.match(html('#analyticsKpis'), /\$15/);
assert.match(html('#analyticsKpis'), /\$45/);
assert.match(html('#analyticsKpis'), /2h/);
assert.match(html('#analyticsKpis'), /100% higher/);
assert.match(html('#analyticsCashflowChart'), /chart-line income/);
assert.match(html('#analyticsClients'), /Client One/);
assert.match(html('#analyticsClients'), /2h logged/);
assert.match(html('#analyticsExpenses'), /Supplies/);
assert.match(html('#analyticsInvoiceHealth'), /\$40/);
assert.match(html('#analyticsInvoiceHealth'), /--collection:60%/);
assert.match(html('#analyticsWorkChart'), /work-bar/);

console.log('Phase 8 analytics smoke test passed.');
