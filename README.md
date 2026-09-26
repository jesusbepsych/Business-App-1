# Business Ledger — Simple Mode Complete V1

This release marks the completed local-first Simple Mode baseline for Business Ledger.

## Product boundary

The app records work performed, money received, money spent, and supporting receipt evidence. It connects Clients → Sessions → Invoices → Payments while preserving Business, Mixed, and Personal expense classification. It does not interpret records for taxes or calculate travel mileage.

## V1 completion changes

- Removed remaining developer-facing sidebar, settings, and notification language from the user interface.
- Replaced internal roadmap wording with direct explanations of on-device storage and backup behavior.
- Added an explicit **Needs review** option to payment entry and editing.
- Payments marked for review now drive the existing Payments action counter, display their state in the ledger and detail view, and can be marked verified.
- Consolidated the browser build around one canonical `app.js` and one canonical `styles.css`.
- Removed unused prototype-brand, sync-card, and profile selectors.
- Preserved the current interface, local schema compatibility, responsive behavior, and financial calculation rules.

## Run

Open `index.html` in a browser or serve this folder with any static-file server.

## Verify

```bash
node --check app.js
node --test tests/*.test.js
```

The analytics review fixture remains enabled until its separately requested removal; it is isolated from saved ledger records and exports.
