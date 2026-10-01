# Business Ledger — Smart Mode V4 Landscape Touch Navigation

## Smart Mode V4 fix

- Makes landscape touchscreen tab selection immediate and deterministic.
- Prevents Safari/WebKit double-tap smart zoom on sidebar and mobile tab controls.
- Keeps ordinary pinch zoom available across the rest of the app.

This release builds on Smart Mode V2 while preserving the completed Simple Mode baseline.

## Smart Mode V3 addition

- Turns **Choose a business** into the entry point for selecting a Google account and the calendars that should feed Planner → Agenda.
- Adds a read-only Google Calendar OAuth flow suitable for individual users of a published app—not a developer's personal connector.
- Adds a dependency-free Node server that keeps the OAuth secret and refresh tokens outside the browser, encrypts saved refresh tokens with AES-256-GCM, validates OAuth state, and serves the existing app.
- Loads timed, all-day, and recurring Google events into the existing Agenda without creating sessions or changing financial records.
- Suppresses clear duplicates when a Google event matches an existing work session at approximately the same time.
- Supports account switching, calendar selection, refresh, token revocation, and disconnect.
- Keeps the static build usable when Calendar is not configured; the connection card explains that server setup is required while all local app functions continue normally.

See `GOOGLE_CALENDAR_SETUP.md` for the short manual setup.

## Smart Mode V2 additions

- Restores the Corporate Atrium photo reliably across flat and folder-preserving deployment workflows by including identical root and nested asset paths.
- Removes the redundant “Work session ·” prefix from session descriptions on printable invoices and saved PDFs.
- Preserves the complete date, time, quantity, rate, amount, totals, and internal session linkage.
- Keeps the context-aware Planner shortcut and Back behavior introduced in Smart Mode V1.

## Smart Mode V1 addition

- The gold Planner shortcut now remembers the main workspace the user came from.
- While Planner is open, the notebook icon becomes a Back arrow with an accessible destination label.
- Pressing it returns to Home, Work, Money, or Records without resetting the preserved sub-tab, filter, pagination, or scroll-independent workspace state.
- Leaving Planner through primary navigation restores the notebook shortcut normally; the next Planner visit records the new origin.

## V14 addition

- Consolidates the active Planner material into one Frosted Window Bays layer while preserving its final appearance, responsive geometry, and accessibility states.
- Uses the existing `assets/atrium-primary.jpg` as the single atrium image source instead of embedding a second copy inside CSS.
- Removes the discontinued recent-session rotation, crossfade timers, transition markup, and styles; Home continues to show the four newest sessions in chronological order.
- Makes storage, domain calculations, rendering, record workflows, and persistent interaction wiring explicit internal boundaries in `app.js`.
- Adds regression coverage for the consolidated asset, stylesheet, dormant-code removal, and internal boundaries.

## V13 addition

- Protects session, payment, expense, and invoice forms from accidental loss after a real user edit.
- Untouched forms still close immediately; the confirmation appears only when current values differ from the form's opening state.
- Applies the protection consistently to Cancel, close, backdrop tap, and Escape interactions.
- Raises meaningful secondary labels and metadata to an 11–12px floor while leaving decorative micro-labels compact.

## Product boundary

The app records work performed, money received, money spent, and supporting receipt evidence. It connects Clients → Sessions → Invoices → Payments while preserving Business, Mixed, and Personal expense classification. It does not interpret records for taxes or calculate travel mileage.

## V12 addition

- Moved Planner from the primary sidebar and mobile tab strip to a dedicated gold notebook shortcut beside global Search.
- Removed the duplicate top-right profile/settings control; Settings remains in the sidebar.
- Increased the gold edit and mint completion-control contrast.
- Added a mid-dark completed-plan archive surface with stronger archived-text legibility.

## V11 addition

- Darkened the Agenda panel to contrast with the lighter notes surface.
- Increased Planner task and calendar typography weight and size.
- Strengthened completion and pencil-edit control visibility.
- Removed sticky iPad touch-hover/focus styling from newly shifted completion controls.

## V10 addition

- Completed-plan archive pagination begins after eight items.
- Planner tasks now include a compact pencil editor using the existing compose field.
- Completion taps are guarded so one tap can complete only one item.
- The Planner bay uses the lighter Sessions glass recipe for closer visual parity.
- The obsolete Attention check-mark illustration has been removed.

## V9 addition

- Unified the Planner surfaces with the Sessions tab's **Frosted Window Bays** material.
- Planner now uses the same blue-gray translucent glass, pale borders, local blur, window-wash highlights, and dense glass controls as the Sessions workspace.
- Preserved the Planner's two-column folio layout, deadline recognition, scrolling, completion archive, and agenda behavior.

## V8 addition

- Lifted both Planner panels one additional luminance step without altering their V7 opacity values.
- Plans now reads as brighter silver-smoke glass; Agenda now uses softer slate-graphite while remaining the visually grounded pane.
- Slightly strengthened platinum edges to retain definition at the brighter surface values.

## V7 addition

- Brightened both translucent Planner panels by lifting their graphite color values without increasing opacity.
- Plans now uses a lighter smoke-silver surface; Agenda uses a brighter graphite surface while retaining clear visual separation.
- Increased platinum edge definition slightly to keep the connected folio crisp against the brighter glass.

## V6 addition

- Increased translucency across both Planner panels so the Corporate Atrium environment remains visible through the Obsidian Mirror treatment.
- Preserved foreground contrast with platinum borders, localized smoky input surfaces, and the existing champagne action accent.
- Tuned full-glass, WebKit lite, and narrow-screen variants independently so the result remains readable across device orientations.

## V5 addition

- Applied the selected **Obsidian Mirror** graphical treatment to the Planner without changing its folio structure or behavior.
- Plans now use translucent smoky graphite glass, while Agenda uses a deeper matte-obsidian surface with platinum dividers and restrained champagne accents.
- Added matching WebKit lite-mode and narrow-screen materials so the treatment remains consistent on iPad portrait, landscape, and split view.

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

For local-only ledger use, open `index.html` or use a static server. For Google Calendar, copy `.env.example` to `.env`, add your OAuth credentials, and run:

```bash
npm start
```

## Verify

```bash
node --check app.js
node --check server.mjs
node --test tests/*.test.js
node tests/webkit-regression.mjs
```

The analytics review fixture remains enabled until its separately requested removal; it is isolated from saved ledger records and exports.
