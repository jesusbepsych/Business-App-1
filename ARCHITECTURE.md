# Business Ledger — Foundation Architecture

## Current build

Phase 0 foundation is implemented and the first vertical slice of Phase 1 is active: business workspaces, clients, work sessions, local persistence, search, record details, and audit-event creation.

## Product principle

Enter information once, then reuse it everywhere. Every summarized dollar should ultimately be traceable to a source record and its supporting evidence.

## Device strategy

The application is currently browser-first and responsive across desktop, iPad, and iPhone widths. The product boundary deliberately separates domain/data logic from device-specific capabilities so the same core can later sit inside a native iOS/iPadOS shell or PWA without redesigning the financial model.

## Persistence strategy

The prototype uses a versioned `LocalRepository` backed by browser local storage. This is **not** the intended production security model; it exists only so early workflows can be tested without pretending cloud authentication already exists.

A production repository should implement the same application-facing contract while adding:

- authenticated account/session identity
- server-side workspace authorization
- secure cross-device synchronization
- conflict handling and record versions
- encrypted file/object storage
- backups and recovery
- sync cursors / timestamps
- offline queueing where useful

The UI therefore labels the current state as **Local preview** rather than “synced.”

## Core domain relationships

```text
Account / Identity
  └── Business Workspace
        ├── Clients
        │     └── Work Sessions
        │            ├── Invoice Line Items ──> Invoice ──> Payments
        │            ├── Expenses
        │            └── Trips / Mileage
        ├── Direct Income (non-invoice)
        ├── Expenses ──> Receipts / Documents
        ├── Vehicles ──> Trips
        ├── Tax Years ──> Estimated Payments
        └── Documents

All material record mutations ──> Audit Events / Traceability
All structured records ──> Analytics / Automation / AI (later phases)
```

## Phase 1 entities now exercised

### Business
- id
- display_name
- legal_name
- entity_type
- default_currency
- timezone
- status
- created_at / updated_at

### Client
- id
- business_id
- display_name
- status
- default_rate_cents
- notes
- created_at / updated_at

### WorkSession
- id
- business_id
- client_id
- date
- start_time / end_time
- duration_minutes
- rate_snapshot_cents
- notes
- invoice_status
- created_at / updated_at

### AuditEvent
- id
- business_id
- event_type
- entity_type / entity_id
- details (prototype only; production audit design will be stricter)
- occurred_at

## Reserved later entities

Invoice, Payment, Expense, Receipt/Document, Vehicle, Trip, TaxYear, EstimatedTaxPayment, ReconciliationMatch, Grant/Fund, and external account/import records remain reserved in the model.

## Data rules

1. Money is stored in integer minor units (cents), never floating point.
2. Historical work sessions store a rate snapshot so changing a client's default rate does not rewrite history.
3. Invoices and payments are separate concepts to prevent double-counting revenue.
4. Tax classification is separate from bookkeeping classification.
5. Business/personal/mixed-use status must be representable without destroying an original transaction amount.
6. Files are linked records, not embedded business logic.
7. Every entity belongs to a Business workspace, even when only one business exists.
8. User-facing IDs can differ from internal IDs (for example invoice numbers).
9. Tax rules and mileage rates must be versioned by tax year.
10. AI may suggest classifications later; sensitive financial/tax changes require confirmation.
11. Material financial edits should produce immutable audit/revision records in production.
12. A summarized value must eventually be explainable by drilling into its source records.

## UI architecture

Permanent navigation stays intentionally small:

- Home
- Work
- Money
- Records

Complexity appears contextually through detail panels, sheets, global search, Quick Add, and progressive disclosure.

### Interaction goals
- navigation feedback is immediate
- most motion stays around 120–220 ms
- mobile workflows do not become compressed desktop forms
- uploads will show immediate local previews before server processing
- OS reduced-motion preference is respected

## Security direction for cloud phase

Production sync should include:

- authorization on every workspace-scoped query
- encryption in transit and at rest
- passkeys and/or MFA
- short-lived signed access for stored documents
- no application secrets shipped in client code
- session/device management
- rate limiting and abuse controls
- backups, exportability, and account recovery
- least-privilege third-party integrations
- no plaintext bank credentials
- append-only or otherwise tamper-resistant audit history for material records

## Next engineering slice

Complete Phase 1 before invoices by adding:

- optional engagement/gig records beneath a client
- recurring work defaults / schedule templates
- stronger session validation and conflict warnings
- archive/reactivate behavior for clients
- optional work locations without exposing unnecessary address data
- import path for historical work records
- final choice of production cloud/auth provider

Only after those work records feel correct should Phase 2 introduce invoice generation.
