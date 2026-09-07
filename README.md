# Business Ledger — Foundation + Phase 1 Alpha

A dependency-free interactive prototype for a business finance and traceability app.

## Run locally

For best behavior, serve the folder rather than double-clicking the HTML file:

```bash
cd business-finance-app-phase0
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Implemented now

### Phase 0 foundation
- responsive desktop / tablet / mobile shell
- Home, Work, Money, Records navigation
- business workspace switcher
- global command/search palette (`/` shortcut)
- Quick Add sheet
- system light/dark appearance
- reduced-motion accessibility
- explicit local-vs-cloud sync state
- provider-neutral repository boundary
- structured JSON backup export

### Phase 1 alpha
- multiple business/gig workspaces
- client creation and editing
- client default hourly rates
- work-session creation and editing
- rate snapshot stored on each session
- session duration and estimated work value
- client/session search
- client and session detail views
- home metrics fed by real work records
- local persistence across browser refreshes
- audit events for create/update/workspace actions

## Important security note

This build stores prototype data in browser local storage. It is **not** yet appropriate for sensitive production financial information or identifying client information. Use aliases/test data during this stage.

The cloud/auth boundary is reserved specifically so secure cross-device synchronization can replace local persistence without rewriting feature logic.

## Working name

“Business Ledger” remains a placeholder name.

### Current UI refinement
Work-session entry now uses a radial time wheel instead of native time inputs. Drag/click once for Start, then again for End; values snap to five-minute increments. Use the arrows or Start/End chips to correct either time.
