# Business Ledger — Phase 2 Invoice Alpha

A dependency-free interactive prototype for a business finance and traceability app.

## Run locally

Serve the folder rather than double-clicking the HTML file:

```bash
cd business-finance-app-phase0
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Implemented

### Foundation
- responsive desktop / tablet / mobile shell
- Home, Work, Money, Records navigation
- business workspace switching
- global search (`/` shortcut)
- Quick Add
- system light/dark appearance
- reduced-motion support
- explicit local-only sync state
- provider-neutral repository boundary
- JSON backup export

### Work records
- multiple business/gig workspaces
- client creation/editing/deletion
- optional client billing email/address
- hourly-rate defaults
- radial 5-minute work-time picker
- 12-hour AM/PM display
- session creation/editing/deletion
- session-specific historical rate snapshots
- client/session search and details
- work metrics

### Phase 2 invoices
- Money dashboard with issued, draft, and overdue indicators
- sequential invoice numbers per business
- configurable prefix and default due period
- sender/contact/payment-instruction defaults
- create invoices from one or many uninvoiced work sessions
- custom flat-rate / quantity line items
- live invoice total while composing
- Draft → Sent workflow
- derived Overdue state
- Void workflow for issued invoices
- delete drafts and release their sessions
- invoice sender/client/rate/line-item snapshots
- linked session protections for issued invoices
- printable invoice view / browser Save as PDF
- invoice search through global command palette
- invoice filtering

## Important security note

This build stores prototype data in browser local storage. It is **not yet appropriate for sensitive production financial information or identifying client information**. Continue using aliases/test data during this stage.

Secure authentication, cloud synchronization, encrypted document storage, and account recovery are intentionally reserved behind the existing persistence boundary.

## Invoice workflow to test

1. Create a client and a few work sessions.
2. Open **Money → + Invoice**.
3. Choose the client and select one or more uninvoiced sessions.
4. Optionally add a custom line item.
5. Save the invoice as Draft.
6. Open it and test Edit, Print / Save PDF, and Mark Sent.
7. Confirm linked work sessions show `In draft` or `Invoiced` appropriately.
8. Move a sent invoice back to Draft or void it and verify the session state follows correctly.

## Working name

“Business Ledger” remains a placeholder name.


### Latest refinement
The Phase 2 invoice builder now stays fully within the visible dynamic browser viewport on tablet-sized Safari windows. Invoice previews and printed/PDF invoices include a dedicated total-hours tally alongside amount due.
