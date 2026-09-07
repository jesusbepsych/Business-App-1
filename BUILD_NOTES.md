# Build Notes — Foundation + Phase 1 Alpha

## What changed in this pass

- Device direction updated to browser-first now, iPhone/iPad-ready later.
- Sync state is explicit: current build is local-only and never claims to be cloud-synced.
- A provider-neutral persistence boundary was introduced so cloud auth/sync can replace local storage later.
- Multiple business/gig workspaces can now be created and switched.
- Clients can be created and edited with a default hourly rate and status.
- Work sessions can be created and edited with date, start/end time, rate snapshot, and notes.
- Work value and monthly hours are calculated from stored sessions.
- Work and client records are searchable locally.
- Home metrics now reflect real prototype records.
- Detail views show traceability anchors for future invoice/mileage/expense relationships.
- Local JSON backup export is available.
- Create/update/workspace actions generate prototype audit events.

## Intentionally not implemented yet

- real authentication
- cloud database synchronization
- file/receipt uploads
- invoices or payments
- expenses or mileage
- tax calculations
- bank integrations
- background GPS
- AI classification

Those remain phased so foundational work records can be validated first.

## Phase 1 Alpha · UI refinement 1

- Reworked primary/secondary action button colors for reliable contrast in light and dark mode.
- Replaced native Start/End time fields with a custom radial time wheel.
- One pointer interaction selects Start; the picker automatically advances to End for the second interaction.
- Time wheel snaps to five-minute increments and supports drag/scrub, click, keyboard arrows, and explicit AM/PM.
- Added Start/End correction controls and clickable time chips so either value can be revisited quickly.
- Added live duration preview.
- Reflowed the work-session form into a wider clock + metadata layout on desktop and a stacked layout on smaller screens.

## Phase 1 Alpha — usability refinement 2
- User-facing work-session times now display in 12-hour AM/PM format while retaining 24-hour values internally for sorting/calculation.
- Added low-clutter overflow menus (`•••`) to client and work-session detail views.
- Added permanent session deletion with inline confirmation.
- Added permanent client deletion with explicit confirmation; linked Phase 1 work sessions are also removed to avoid orphaned records.
- Deletion removes prior audit payloads for the deleted records and retains only a minimal non-content deletion event.
