# Business Ledger — Simple Mode Complete V4 Planner

This release marks the completed local-first Simple Mode baseline for Business Ledger.

## Product boundary

The app records work performed, money received, money spent, and supporting receipt evidence. It connects Clients → Sessions → Invoices → Payments while preserving Business, Mixed, and Personal expense classification. It does not interpret records for taxes or calculate travel mileage.

## V4 addition

- Added a fifth **Planner** workspace using the connected two-pane folio design: spacious vertical plans on the left and a focused upcoming agenda on the right.
- Plans stay lightweight: free-form text is always valid, while recognized dates are offered as an optional confirmation and matching client names are linked quietly.
- Dated plans appear beside upcoming work sessions in Agenda and due/overdue plans can surface in Home → Needs attention.
- One-click completion moves a plan into a recoverable archive; completed plans are automatically removed after 30 days.
- Planner records are included in local persistence, workspace switching, command search, and JSON backup.

## V3 additions

- Automated Playwright WebKit regression coverage for iPad portrait, landscape, and split-view layouts.
- Safari/WebKit-safe progressive client-card reveal without `content-visibility` suppressing painted cards.
- Touch workflows, filters, dialogs, analytics expansion, local persistence, overflow, and reduced-motion checks.

## V2 addition

- Client libraries with seven or more visible matches now reveal cards progressively as the user scrolls down or back up.
- The reveal uses a restrained fade-and-rise transition with short row staggering.
- The observer only animates cards near the viewport, avoiding unnecessary transition work across unusually large client lists.
- Reduced-motion and browsers without `IntersectionObserver` reveal every card immediately.

## V1 completion foundation

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
node tests/webkit-regression.mjs
```

The analytics review fixture remains enabled until its separately requested removal; it is isolated from saved ledger records and exports.
