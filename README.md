# Business Ledger — Phase 8, Revision 49

Revision 49 turns Records into a search-first receipt archive. The single search field now combines merchant, category, date, amount, classification, purpose, filename, and review-state matching. Browsing is organized automatically by year and collapsible month, with progressive loading for long histories and no separate filter panel.

Revision 48 adds inclusive multi-select filters for session clients and expense categories. Multiple choices within a sub-filter are shown together, while the existing search and primary status/classification filters continue to narrow those results.

Revision 44 retires Taxes, Mileage, and Vehicles as one coordinated product change. The permanent workspace is now:

**Home · Work · Money · Records**

Business Ledger records work performed, money received, money spent, and supporting evidence. It distinguishes Business, Mixed, and Personal spending without interpreting those records for taxes or calculating travel mileage.

## Active workflows

- Clients and work sessions, including the single-clock session editor and client-scoped quick-time presets
- Invoices and invoice-linked payments
- Direct income
- Expenses with Business, Mixed, or Personal classification
- Business-use amounts and bookkeeping categories
- Optional receipts and record evidence
- Dashboard analytics sourced from the retained work and money records
- JSON export and local browser persistence

## Preserved financial classification

The retirement does not change expense classification or category behavior.

- Original expense totals remain intact.
- Business expenses retain their business-use amount.
- Mixed expenses retain both the original total and business portion.
- Personal expenses retain a zero business portion.
- Food, Gas, Parking, Car, Subscriptions, Misc, Fees, and Work Equipment remain available.
- Older saved expense-category labels remain readable.

These fields are bookkeeping context. The app does not claim that a category or business-use amount is deductible.

## Compatibility boundary

Existing schema-version 9 workspaces still load. Legacy `vehicles` and `mileageTrips` collections are accepted as inert compatibility data so opening an older local workspace is non-destructive. No current view, metric, search result, command, form, or mutation consumes those collections.

## Analytics review fixture

The body attribute `data-analytics-sample="true"` enables deterministic, presentation-only sample data for device review. The fixture is never saved to localStorage and never enters exports or evidence history. Remove the attribute when live-only analytics review is desired.

## Run

Serve this directory with any static web server and open `index.html`.

## Validate

```bash
node --check app.js
node --test tests/*.test.js
```

This is a local browser prototype, not a production storage or security model.
