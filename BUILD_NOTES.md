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
