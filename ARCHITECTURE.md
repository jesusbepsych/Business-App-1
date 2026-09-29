# Business Ledger — Architecture

## Smart Mode V2 product boundary

Business Ledger records:

- work performed;
- money received;
- money spent;
- supporting records and receipts.

It distinguishes Business, Mixed, and Personal activity. It does not interpret records for taxes, estimate tax liability, calculate mileage, or manage vehicles.

## Permanent navigation

**Home · Work · Money · Records**

Money contains contextual Invoices, Payments, and Expenses tabs. Taxes, Mileage, and Vehicles have no navigation destination, form, command, search result, dashboard counter, or derived analytics view.

## Core relationships

```text
Business Workspace
├── Clients
│   └── Work Sessions
│       └── Invoice Line Item ──> Invoice ──> Payments
├── Direct Income ──────────────────────────> Payments
├── Expenses ──> Receipts
└── Audit Events / Evidence Snapshots

Structured work and money records ──> Dashboard Analytics
```

## Persistence

The app uses a versioned `LocalRepository` backed by browser localStorage. Receipt bytes use IndexedDB while receipt metadata remains in the structured workspace.

Schema-version 9 data remains loadable. The legacy `vehicles` and `mileageTrips` arrays are accepted and preserved only to avoid destructive loading of an older workspace. They are retired compatibility fields: active application code does not read, render, search, edit, count, or derive values from them.

The repository boundary keeps persistence concerns separate from calculations, rendering, and interaction handling.

## Internal code boundaries

The browser build remains intentionally dependency-free and uses one canonical `app.js`, but its responsibilities are now divided into explicit sections:

| Boundary | Responsibility |
| --- | --- |
| Storage adapters | Versioned localStorage workspace data and IndexedDB receipt bytes |
| Repository mutations | Saves, audit events, and retained evidence snapshots |
| Domain queries and calculations | Workspace-scoped selectors, money/time calculations, statuses, and formatting |
| Rendering | Reads current state and updates views without owning persistence |
| Record workflows | Form setup, validation, saves, deletion, and detail panels |
| Interaction wiring | Registers persistent navigation, filter, modal, and form controls |

Feature-specific render functions may bind controls they create dynamically; persistent controls are registered together at the end of `app.js`.

## Active entities

### Business

Workspace identity, currency/timezone, status, and invoice settings.

### Client

Workspace-scoped display identity, active status, default hourly rate, visual color, billing details, notes, and timestamps.

### WorkSession

Client link and snapshot, date, start/end time, duration, rate snapshot, note, invoice state/link, and timestamps.

### Invoice

Sequential number, sender/recipient snapshots, issue/due dates, state, session-backed or custom line items, notes, totals, and timestamps.

### Payment

Invoice-linked or direct income, source/client snapshots, amount, received date, method, reference, note, explicit review state, and timestamps.

### Expense

Date, merchant/description, original total, classification, business-use amount, bookkeeping category, optional business purpose and work context, review state, optional receipt, and timestamps.

### Receipt

Workspace/expense link plus file metadata. File bytes remain separate from the structured financial record.

### AuditEvent and EvidenceSnapshot

Trace material mutations and preserve final structured copies of deleted records without participating in active totals.

## Financial integrity rules

1. Money uses integer cents.
2. Invoice value and received cash are separate concepts.
3. Received totals come from Payment records, not invoice totals.
4. Historical sessions keep their own rate snapshot.
5. Original expense totals are never replaced by business-use amounts.
6. Business expenses may carry a 100% business portion; Personal expenses carry a zero business portion; Mixed expenses retain a portion between zero and the original total.
7. Categories are bookkeeping labels and do not constitute tax treatment.
8. Client/session links on expenses are optional context; expenses survive deletion of linked work through snapshots.
9. Receipt changes do not change expense amounts.
10. Summaries remain traceable to retained source records.

## UI and device strategy

The app is browser-first and responsive across desktop, iPad, and iPhone widths. Device-specific rendering optimizations do not change domain behavior. Analytics sample fixtures are presentation-only and never enter the repository.

## Retirement guardrail

Future work should not reintroduce tax interpretation, mileage calculation, vehicle management, or related counters through generic analytics or classification changes. Gas, Parking, Car, Work Equipment, and Business/Mixed/Personal classification remain ordinary bookkeeping concepts.
