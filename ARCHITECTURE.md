# Phase 0 Architecture

## Product principle

Enter information once, then reuse it everywhere. Every summarized dollar should ultimately be traceable to a source record and its supporting evidence.

## Core domain relationships

```text
Business
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

All financial records ──> Audit Events / Traceability
All structured records ──> Analytics / Automation / AI (later phases)
```

## Reserved domain entities

### Business
- id
- legal_name
- display_name
- entity_type
- tax_identifier_reference (never plaintext in UI logs)
- default_currency
- timezone
- status
- created_at / updated_at

### Client
- id
- business_id
- display_name
- status
- default_rate
- billing_preferences
- location references
- notes

### Gig / Engagement
- id
- business_id
- client_id (optional)
- name
- rate rules
- status
- start/end dates

### WorkSession
- id
- business_id
- client_id
- engagement_id (optional)
- started_at / ended_at
- duration
- rate_snapshot
- location references
- notes
- invoicing_status

### Invoice
- id
- business_id
- client_id
- invoice_number
- issue_date / due_date
- status
- immutable monetary snapshot
- revision lineage

### Payment
- id
- business_id
- invoice_id (optional)
- amount
- method
- received_at
- reconciliation_status

### Expense
- id
- business_id
- client_id / work_session_id (optional)
- merchant
- amount
- business_use_amount / percentage
- category
- business_purpose
- tax_review_status
- occurred_at

### Receipt / Document
- id
- business_id
- linked_record_type / id
- file metadata
- checksum
- upload timestamp
- retention status

### Vehicle
- id
- business_id
- label
- year / make / model
- mileage method metadata by tax year

### Trip
- id
- business_id
- vehicle_id
- work_session_id (optional)
- start/end time
- origin / destination references
- distance
- business purpose
- classification status

### TaxYear
- id
- business_id
- year
- configuration version
- estimated payments
- review flags

### AuditEvent
- id
- business_id
- actor_id
- entity_type / entity_id
- event_type
- timestamp
- before/after references
- reason (when required)

## Data rules established now

1. Money is stored in integer minor units (cents), never floating point.
2. Financial records are never silently overwritten; material changes generate revision/audit events.
3. Invoices and payments are separate concepts to prevent double-counting revenue.
4. Tax classification is separate from bookkeeping classification.
5. Business/personal/mixed-use status must be representable without destroying the original transaction amount.
6. Files are linked records, not embedded business logic.
7. Every entity belongs to a Business workspace, even when the app only has one business initially.
8. User-facing IDs are different from internal database IDs where useful (for example invoice numbers).
9. Tax rules and mileage rates must be versioned by tax year rather than hard-coded globally.
10. AI may suggest classifications later; sensitive accounting/tax changes require explicit user confirmation.

## UI architecture

Primary navigation remains intentionally small:

- Home
- Work
- Money
- Records

Complexity appears contextually through detail views, sheets, command search, and progressive disclosure rather than adding permanent navigation tabs.

### Interaction targets
- Common navigation feedback: <= 150 ms perceived response.
- Motion: generally 120–220 ms, subtle and interruptible.
- Uploads: instant local preview; processing may continue asynchronously in the UI without blocking navigation.
- Mobile: bottom navigation with centered Quick Add.
- Desktop/tablet: compact sidebar plus global command search.
- Reduced-motion OS preference is respected.

## Security foundation

Phase 0 stores no sensitive financial data. Future persistence should include:

- server-side authorization on every workspace-scoped query
- encryption in transit and at rest
- passkey/MFA support
- secure file storage with short-lived signed access
- strict separation between application secrets and client code
- immutable audit events for material financial changes
- rate limiting and session/device management
- backups and exportability
- no plaintext bank credentials
- least-privilege external integrations

## Phase 0 completion criteria

- Responsive shell works at phone, tablet, and desktop widths.
- Home / Work / Money / Records navigation is instant and coherent.
- Business switcher pattern exists without forcing multi-business complexity into every screen.
- Quick Add pattern exists and is reachable on desktop and mobile.
- Command/search interaction is reserved globally.
- Design system handles light/dark OS appearance and reduced motion.
- Domain model can support all later roadmap phases without redefining the basic ownership relationships.
