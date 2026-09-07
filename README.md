# Business Ledger — Phase 3 Payments Alpha

A dependency-free interactive prototype for a business finance and traceability app.

## Run locally

Serve the folder rather than double-clicking the HTML file:

```bash
cd business-finance-app-phase3-payments-alpha
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Implemented

### Foundation
- responsive desktop / tablet / mobile shell
- Home, Work, Money, Records navigation
- multiple business/gig workspaces
- global search (`/` shortcut)
- Quick Add
- system light/dark appearance
- reduced-motion support
- explicit local-only sync state
- provider-neutral repository boundary
- JSON backup export

### Work records
- client creation/editing/deletion
- optional client billing details
- hourly-rate defaults
- radial 5-minute work-time picker
- 12-hour AM/PM display
- work-session creation/editing/deletion
- session-specific historical rate snapshots
- client/session search and details
- work metrics

### Phase 2 invoice engine
- sequential invoice numbers per business
- configurable sender identity, prefix, due period, and payment instructions
- invoice creation from one or many uninvoiced work sessions
- custom line items
- exact total-hours tally
- Draft → Sent workflow
- overdue detection
- void/delete-draft workflows
- sender/client/rate/line-item snapshots
- issued-session protections
- printable / Save-as-PDF invoice view

### Phase 3 payments + income ledger
- Payment records are separate from Invoice records
- full and partial invoice payments
- invoice balance calculated from linked payments
- derived invoice states: Sent, Partially paid, Paid, Overdue, Draft, Void
- prominent **Record payment** action from sent invoices
- remaining invoice balance prefilled for faster payment entry
- overpayment protection for invoice-linked payments
- payment date, method, reference/confirmation, and notes
- supported methods: Zelle, Venmo, ACH, direct deposit, cash, check, card, and other
- direct/other income that does not require an invoice
- optional client link for direct income
- Money dashboard totals for received cash, outstanding invoice balance, and overdue invoices
- dedicated Invoices / Payments tabs
- searchable payment records
- payment detail/edit/delete workflow
- invoice payment history embedded in invoice detail
- printable invoices show invoice total, payments received, and current amount due
- invoices with linked payments are protected from billable-content edits, draft reversal, or voiding until the payment record is corrected/removed
- cash-received totals use payments only, preventing an invoice and its payment from being counted as two cash entries

## Important security note

This build stores prototype data in browser local storage. It is **not yet appropriate for sensitive production financial information or identifying client information**. Continue using aliases/test data during this stage.

Secure authentication, cloud synchronization, encrypted document storage, and account recovery remain reserved behind the existing persistence boundary.

## Recommended Phase 3 test

1. Create or open a client with several work sessions.
2. Create an invoice, then mark it Sent.
3. Use **Record payment** from the invoice detail.
4. Confirm the remaining invoice balance is prefilled.
5. Record only part of it and verify the invoice becomes **Partially paid**.
6. Record the remaining amount and verify the invoice becomes **Paid** with a $0 balance.
7. Edit or delete one payment and verify the invoice balance/status immediately recalculates.
8. Try entering more than the remaining invoice balance and verify it is rejected.
9. Record **Other income** that does not use an invoice and verify it appears in the Payments ledger but not as an invoice.
10. Print/Save the invoice as PDF and verify payment history and current amount due are correct.
11. Refresh the browser and make sure all Phase 3 records persist.

## Working name

“Business Ledger” remains a placeholder name.
