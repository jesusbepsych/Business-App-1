## Corporate Atrium embedded-scene fix

- The approved atrium photograph is now embedded directly in `styles.css` as a data URI. This removes the failure mode where the app silently fell back to the synthetic dark SVG because the nested `assets/atrium-primary.jpg` file was missing, stale, or not uploaded to GitHub Pages.
- Added cache-busting query versions to `styles.css` and `app.js` for deployment testing.
- Reduced synthetic light-rail opacity and global darkening so the actual glass walls, skyline, plants, seating, and reflective marble floor remain clearly visible.
- iPad/Safari keeps the stabilized non-scroll-linked motion profile.

> Stability pass note: the Home atrium scene now uses a bundled local image plate plus a runtime lite-profile for Safari/iPad/coarse-pointer devices to avoid scroll shimmer and fallback issues.

# Business Ledger — Architecture

## Current build

Phase 0 foundation, Phase 1 work records, Phase 2 invoices, Phase 3 payments/income ledger, and Phase 4 expenses/receipt evidence are active.

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
        ├── Expenses ──> Receipts (active) / Documents (later)
        ├── Vehicles ──> Trips / Mileage (later)
        ├── Tax Years ──> Estimated Payments (later)
        └── Documents

Material mutations ──> Audit Events / Traceability
Structured records ──> Analytics / Automation / AI (later phases)
```

## Schema version 6

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

Money now uses contextual **Invoices / Payments / Expenses** tabs instead of adding permanent top-level navigation. Expense entry is available from Quick Add and from the Expenses panel; invoice settings remains visually de-emphasized as a utility action.

## Security direction

Production sync should add authorization on every workspace-scoped query, encryption in transit and at rest, passkeys/MFA, short-lived document access, no client-side secrets, session/device management, rate limiting, backups/recovery, least-privilege integrations, no plaintext bank credentials, and tamper-resistant history for material records.

## Phase 4 expense + receipt model

### Expense
- id / business_id
- date
- merchant / description
- total_cents (what actually left the user)
- classification (`business`, `mixed`, `personal`)
- business_cents (preserves the business-use portion separately)
- category (bookkeeping category only; not a tax determination)
- business_purpose
- optional client_id / client_name_snapshot
- optional session_id plus session date/time snapshots
- review_status (`ready`, `needs_review`)
- receipt_id
- created_at / updated_at

### Receipt metadata
- id / business_id / expense_id
- file_name / mime_type / size
- created_at

Receipt file bytes are stored separately in browser IndexedDB for the prototype. Structured financial data stays in LocalRepository/localStorage. This mirrors the production direction where financial records and encrypted object storage should remain separate services linked by IDs.

### Expense integrity rules
1. Original expense total is never replaced by a deductible/business amount.
2. Business expenses default to 100% business use; personal expenses preserve a $0 business portion; mixed expenses require a business portion greater than $0 and less than the original total.
3. Expense categories are bookkeeping labels only. Tax treatment is deferred to Phase 6.
4. A missing business-purpose note automatically places business/mixed expenses into `needs_review`; the user can also manually keep any expense in review.
5. Receipts are optional. Attaching/replacing/deleting a receipt never changes the expense amount.
6. Client/session links are optional context. If a linked client or session is deleted later, the expense survives and retains useful snapshots rather than being deleted with work records.
7. Receipt metadata is included in structured data; receipt file bytes are intentionally not included in the current JSON backup yet.

## Next engineering slice

Phase 5 should introduce mileage + vehicle tracking as its own focused workflow:

- vehicle records
- manual business-trip logging
- start/end locations and mileage
- client/session association
- business-purpose notes
- yearly mileage totals
- tax-year mileage rates later consumed by Phase 6
- later GPS-assisted trip suggestions only after manual logging feels solid

## Phase 3 refinement 4 UI behavior

The invoice work-session selector is a bounded nested scroll region; this is presentation-only and does not change invoice/session relationships. Home recent-session rotation is also presentation-only: it samples from the twelve most recent session records and never mutates or reorders stored data.


## Phase 3 refinement 7 interaction rules

- Status filters use direct-select popovers rather than cycle-on-click behavior; the underlying filter state remains UI-only and does not modify stored records.
- Sessions, Invoices, and Payments use bounded list pagination to keep long ledgers scannable without increasing permanent screen density.
- Invoice `Select all / Clear` operates only on currently eligible session checkboxes and still feeds the same immutable invoice snapshot workflow.
- Home Invoice earnings is cumulative across recorded invoice-linked Payments; the `All time` label clarifies that display basis without changing calculation logic.
## Workspace time semantics

- Event/audit timestamps (`createdAt`, `updatedAt`, `occurredAt`) remain UTC ISO instants.
- Date-only business records (session date, invoice issue/due date, payment received date) are calendar dates interpreted using the active workspace timezone.
- “Today,” overdue status, current-month metrics, and default form dates use the workspace timezone (`America/Los_Angeles` for Play It Forward), preventing UTC day-boundary shifts.
- Date-only display formatting is timezone-neutral so a stored `YYYY-MM-DD` does not move backward/forward when viewed on a device in another timezone.


## Collapsible navigation shell
The desktop sidebar collapse state is intentionally UI-only and does not touch business data or schema versioning. The app shell transitions its grid from `260px + main` to `0px + main`, allowing the existing responsive content grids to reflow naturally rather than leaving a reserved blank column. The preference is stored separately from financial data under `business-ledger-sidebar-collapsed`. Mobile navigation remains a separate presentation path below 921px.

## UI state refinement — sidebar default and top-bar veil
The sidebar remains a layout state rather than an overlay. If no preference exists, its desktop/tablet default is collapsed; after the user explicitly toggles it, `business-ledger-sidebar-collapsed` persists that choice. The Home view remains the initial application view. The sticky utility bar uses a masked gradient blur layer so content protection fades into the document rather than creating a hard rectangular occlusion boundary.

### Sticky utility scrim
The desktop/tablet topbar uses an alpha-faded page-color scrim rather than a full-width `backdrop-filter`. This is deliberate: backdrop blur spreads bright underlying pixels and can create a visible light band over text/cards on dark themes. The controls themselves provide their own surface contrast, while the scrim only manages the transition between document content and the sticky utility region.

## Corporate Atrium Home visual architecture
The Home theme is isolated from domain/business logic.

Visual stack (back to front):
1. `#homeAtriumScene` fixed physical environment.
2. Primary sharp office photo plate + local SVG fallback.
3. Secondary masked architectural plate for side/depth variation.
4. CSS structural light rails / floor glints / atmosphere.
5. Existing live Business Ledger shell and Home DOM.
6. Local `backdrop-filter` on the actual Home cards/panels.
7. Environment-aware reflection pseudo-elements driven by CSS variables.

`setView()` toggles `body.home-atrium-active`, so navigating to Work/Money/Records removes the atrium visual layer without altering any application data or view behavior. Pointer/touch/scroll input only changes presentation CSS variables and never persists to financial data.

> Money view now participates in the shared atrium scene and runtime profile. Its page-level surfaces are themed; modal/detail architecture is unchanged.
