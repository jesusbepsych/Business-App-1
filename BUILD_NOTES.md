# Build Notes — Phase 2 Invoice Alpha

## Main additions

- Upgraded local schema from version 2 to version 3 with automatic migration of existing Phase 1 data.
- Existing clients/sessions stored under the same local-storage key are preserved.
- Added Invoice records and per-business invoice-number/default settings.
- Added optional client billing email/address fields behind progressive disclosure.
- Replaced the Money placeholder with an invoice dashboard and history.
- Added invoice creation from existing work sessions without re-entering hours/rates.
- Added selectable multi-session billing and optional custom line items.
- Added Draft, Sent, Overdue (derived), and Void behavior.
- Added printable invoice rendering for browser print / Save as PDF.
- Added sender and recipient snapshots so old invoice content does not silently change when business/client defaults change.
- Linked sessions now show `Uninvoiced`, `In draft`, or `Invoiced`.
- Sent invoice sessions are protected from direct edit/delete until the invoice is moved back to Draft or voided.
- Draft invoice deletion and sent invoice voiding release linked work sessions for reuse.
- Client deletion is blocked while active invoices still reference that client.
- Added invoice search and simple status filters.
- Added invoice settings for prefix, due days, sender contact information, address, and payment instructions.

## Intentionally deferred

- actual payment records / partial payments
- direct income without invoices
- expenses / receipts
- mileage
- tax calculations
- cloud auth / sync
- file uploads
- banking integrations
- AI classification

These remain separate roadmap phases to keep the financial model testable and avoid treating an issued invoice as money actually received.


## Phase 2 refinement — viewport + invoice totals
- Invoice builder now respects the dynamic visible viewport (`dvh`) with safe top/bottom breathing room, preventing the title/header from being clipped on iPad/Safari-sized browser windows.
- Invoice previews and printable/PDF invoices now show both **Total hours** and **Amount due** at a glance.
- Total hours include work-session line items only; custom charges do not inflate labor time.
- Draft invoice summary also shows selected work duration next to line-item count.
