# Business Ledger — Architecture

## Current build

Phase 0 foundation, Phase 1 work records, Phase 2 invoices, and Phase 3 payments/income ledger are active.

## Product principle

Enter information once, then reuse it everywhere. Every summarized dollar should ultimately be traceable to a source record and supporting evidence.

## Device strategy

The application remains browser-first and responsive across desktop, iPad, and iPhone widths. Domain/data logic stays separate from device-specific capabilities so the same core can later sit inside a native iOS/iPadOS shell or PWA without redesigning the financial model.

## Persistence strategy

The prototype uses a versioned `LocalRepository` backed by browser local storage. This is **not** the intended production security model. It exists so early workflows can be tested before secure authentication/cloud synchronization is connected.

A production repository should implement the same application-facing boundary while adding authenticated identity, workspace authorization, secure cross-device synchronization, conflict handling, encrypted object storage, recovery/backups, offline queueing where useful, and sync/version metadata.

## Core domain relationships

```text
Account / Identity
  └── Business Workspace
        ├── Clients
        │     └── Work Sessions
        │            └── Invoice Line Item ──> Invoice ──> Payments
        ├── Direct Income ────────────────────────────────> Payments
        ├── Expenses ──> Receipts / Documents (later)
        ├── Vehicles ──> Trips / Mileage (later)
        ├── Tax Years ──> Estimated Payments (later)
        └── Documents

Material mutations ──> Audit Events / Traceability
Structured records ──> Analytics / Automation / AI (later phases)
```

## Schema version 5

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
- color_key (curated visual identity; presentation aid only)
- billing_email / billing_address
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
- persistence status (`draft`, `sent`, `void`)
- display state derived with payments (`Draft`, `Sent`, `Partially paid`, `Paid`, `Overdue`, `Void`)
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

### Payment
- id
- business_id
- kind (`invoice`, `direct`)
- invoice_id when invoice-linked
- invoice_number_snapshot
- client_id when known
- client_name_snapshot
- source_name for direct income
- description for direct income
- amount_cents
- received_date
- method
- reference / confirmation
- notes
- created_at / updated_at

### AuditEvent
- id
- business_id
- event_type
- entity_type / entity_id
- details
- occurred_at

## Invoice + payment integrity rules

1. Invoice value and cash received are separate concepts and separate entities.
2. Money “Received” totals are calculated from Payment records, not invoice totals.
3. A sent invoice balance = invoice snapshot total − linked Payment total.
4. Partial payments are valid and produce a derived `Partially paid` state unless the remaining balance is already overdue.
5. Full payment produces a derived `Paid` state with a zero balance.
6. Invoice-linked payments cannot exceed the invoice balance available before that payment.
7. An invoice with linked payments cannot have billable contents edited, be moved back to Draft, or be voided until the linked payments are corrected/removed.
8. Deleting or editing a payment immediately recalculates invoice balance/status.
9. Direct income uses a Payment record with no invoice, avoiding fake invoices solely for bookkeeping.
10. Future bank imports should match a bank deposit to an existing Payment record instead of creating a second income record.
11. Invoice sender, recipient, descriptions, rates, and totals remain historical snapshots.
12. Invoice numbers remain sequential per business and are never reused.
13. Client color is a presentation attribute only; it never changes billing, tax, or accounting behavior.

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

Permanent navigation remains **Home · Work · Money · Records**.

Money now uses contextual **Invoices / Payments** tabs instead of adding permanent top-level navigation. `+ Payment` and `+ Invoice` are the main money-entry actions; invoice settings is visually de-emphasized as a utility action.

## Security direction

Production sync should add authorization on every workspace-scoped query, encryption in transit and at rest, passkeys/MFA, short-lived document access, no client-side secrets, session/device management, rate limiting, backups/recovery, least-privilege integrations, no plaintext bank credentials, and tamper-resistant history for material records.

## Next engineering slice

Phase 4 should introduce expenses + receipt evidence:

- manual expense capture
- business / personal / mixed classification
- business-purpose notes
- categories
- client/job links
- receipt/document attachment model
- missing-receipt review queue
- expense search and totals

Mileage remains Phase 5 so vehicle deduction logic can be built as its own focused workflow instead of being buried inside generic expenses.


## Phase 3 refinement 4 UI behavior

The invoice work-session selector is a bounded nested scroll region; this is presentation-only and does not change invoice/session relationships. Home recent-session rotation is also presentation-only: it samples from the twelve most recent session records and never mutates or reorders stored data.
