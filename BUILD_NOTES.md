# Build Notes — Phase 3 Payments Alpha

## Main objective

Introduce cash-received records without conflating them with invoice value.

## Phase 3 additions

- Added schema v4 with `payments` as a first-class collection.
- Existing schema v2/v3 local data migrates forward automatically.
- Added invoice-linked payments and direct/other income using one Payment entity.
- Added full/partial payment support.
- Added payment-aware invoice balances and statuses.
- Added invoice-payment history and payment detail records.
- Added payment edit/delete with audit events.
- Added overpayment validation.
- Added payment methods, received date, optional reference, and note fields.
- Added optional direct-income client linking.
- Added Payments ledger and Money tabs.
- Added payment search to global command palette.
- Updated printable invoices to show total, paid, and amount due.
- Added integrity lock: invoices with received payments cannot be rewritten, reverted to Draft, or voided until linked payment records are corrected or removed.

## Accounting-model rule

Invoices represent **billing/amount earned**. Payments represent **cash actually received**. Money dashboard “Received” totals are calculated from Payment records only.

This prevents a common double-counting mistake where both the invoice and the corresponding deposit are treated as received revenue.

## Deferred intentionally

- bank account imports and automatic reconciliation
- payment file attachments / deposit screenshots
- refunds and chargebacks
- payment processing through the app
- accounting-basis / tax-year engine
- receipt ingestion and expense workflows
- secure production cloud database and authentication

These remain later roadmap phases so Phase 3 can be tested independently.

## Phase 3 usability refinement 1
- Work Sessions now paginate at 7 records per page with compact previous/next controls.
- Touch devices can swipe horizontally across the session list to move between pages.
- Session search/filter changes reset pagination to page 1; newly logged work also returns to page 1.
- Sessions table now prioritizes Client before Date.
- Payments ledger now prioritizes Source before Received date.
- Sent and Void invoices have distinct status colors for faster visual scanning.
- Home now includes Invoice earnings based only on actual invoice-linked payments received.
