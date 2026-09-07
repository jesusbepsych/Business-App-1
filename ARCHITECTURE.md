# Business Ledger — Architecture

## Current build

Phase 0 foundation and Phase 1 work records are active. Phase 2 now introduces the first invoice engine: draft creation from work sessions, invoice snapshots, issued/overdue/void states, printable invoices, and invoice-specific defaults.

## Product principle

Enter information once, then reuse it everywhere. Every summarized dollar should ultimately be traceable to a source record and its supporting evidence.

## Device strategy

The application remains browser-first and responsive across desktop, iPad, and iPhone widths. Domain/data logic stays separate from device-specific capabilities so the same core can later sit inside a native iOS/iPadOS shell or PWA without redesigning the financial model.

## Persistence strategy

The prototype uses a versioned `LocalRepository` backed by browser local storage. This is **not** the intended production security model. It exists so early workflows can be tested before secure authentication/cloud synchronization is connected.

A production repository should implement the same application-facing boundary while adding authenticated account identity, workspace authorization, secure cross-device synchronization, conflict handling, encrypted object storage, recovery/backups, offline queueing where useful, and sync/version metadata.

## Core domain relationships

```text
Account / Identity
  └── Business Workspace
        ├── Clients
        │     └── Work Sessions
        │            └── Invoice Line Item ──> Invoice ──> Payments (Phase 3)
        ├── Direct Income (later)
        ├── Expenses ──> Receipts / Documents (later)
        ├── Vehicles ──> Trips / Mileage (later)
        ├── Tax Years ──> Estimated Payments (later)
        └── Documents

Material mutations ──> Audit Events / Traceability
Structured records ──> Analytics / Automation / AI (later phases)
```

## Schema version 3

### Business
- id
- display_name / legal_name
- entity_type
- currency / timezone
- status
- invoice_settings
  - prefix
  - next_number
  - default_due_days
  - sender_email / phone / address
  - payment_instructions
- created_at / updated_at

### Client
- id
- business_id
- display_name
- status
- default_rate_cents
- billing_email / billing_address (optional)
- notes
- created_at / updated_at

### WorkSession
- id
- business_id
- client_id
- client_name_snapshot
- date
- start_time / end_time
- duration_minutes
- rate_snapshot_cents
- notes
- invoice_status (`uninvoiced`, `draft`, `invoiced`)
- invoice_id
- created_at / updated_at

### Invoice
- id
- business_id
- human-readable sequential invoice number
- client_id
- recipient snapshot
- sender snapshot
- issue date / due date
- status (`draft`, `sent`, `void`; overdue is derived)
- line items
  - session-backed line item or custom line item
  - description snapshot
  - quantity / quantity minutes
  - rate cents
  - amount cents
  - source session id when applicable
- note
- sent_at / voided_at
- created_at / updated_at

### AuditEvent
- id
- business_id
- event_type
- entity_type / entity_id
- details
- occurred_at

## Invoice integrity rules

1. Creating an invoice consumes selected uninvoiced sessions into a **Draft** relationship rather than duplicating their values.
2. Marking the invoice **Sent** changes linked session state to `invoiced`.
3. Deleting a draft releases its linked sessions back to `uninvoiced`.
4. Voiding a sent invoice preserves the invoice record but releases its sessions so corrected billing can be created.
5. A session on a sent invoice is protected from direct edit/delete until that invoice is moved back to Draft or voided.
6. Client deletion is blocked while active draft/sent invoices reference that client.
7. Invoice sender, recipient, descriptions, rates, and totals are snapshots. Later client/business/rate changes do not silently rewrite older invoices.
8. Invoice numbers are allocated sequentially per business and are not reused after creation.
9. Invoice and Payment remain different entities. “Sent” does not mean “Paid.”
10. Overdue state is derived from a sent invoice whose due date has passed; Phase 3 will make this payment-aware.

## Broader data rules

- Money is stored in integer minor units (cents), never floating point.
- Historical work sessions keep their own rate snapshot.
- Tax classification stays separate from bookkeeping classification.
- Mixed business/personal use must remain representable without destroying original transaction amounts.
- Files are linked records rather than embedded business logic.
- Every entity belongs to a business workspace.
- User-facing identifiers can differ from internal IDs.
- Tax and mileage rules will be versioned by tax year.
- AI may suggest classifications later; material financial/tax changes require confirmation.
- Summarized values should remain drillable to source records.

## UI architecture

Permanent navigation stays intentionally small: **Home · Work · Money · Records**.

Phase 2 keeps invoice complexity contextual: Quick Add creates an invoice; Money shows the history and status totals; invoice building happens in a focused sheet; invoice detail contains preview, print, edit, status, and low-frequency destructive actions behind `•••`.

## Security direction

Production sync should add authorization on every workspace-scoped query, encryption in transit and at rest, passkeys/MFA, short-lived document access, no client-side secrets, session/device management, rate limiting, backups/recovery, least-privilege integrations, no plaintext bank credentials, and tamper-resistant history for material records.

## Next engineering slice

After invoice workflow feedback, Phase 3 should introduce payments as separate records:

- full / partial payments
- payment method and date
- outstanding balances
- paid / partially paid status derived from actual payments
- invoice-to-payment reconciliation
- protection against counting invoice value and bank/payment deposits twice

Phase 1 quality-of-life enhancements such as engagements, recurring schedules, conflict warnings, locations, and historical import can still be layered in without changing the invoice model.
