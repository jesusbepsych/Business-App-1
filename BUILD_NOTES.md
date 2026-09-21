# Revision 30 — Custom Analytics Period

- Replaced the Last 3/6/12 months, Year to date, and All time menu with compact From month/year and To month/year selectors in the Business Pulse toolbar.
- The selected inclusive period now drives KPI totals, all analytics charts, ranked income and expense data, and range-scoped invoice health.
- The initial period remains the latest six months. A current-month end includes records through today; a historical end includes the entire selected month.
- KPI trend arrows now compare the selected ending calendar month against the immediately preceding calendar month, independent of the selected range length.
- Each KPI names both compared months and displays the prior-month value; the larger number remains the total for the full chosen analytics period.
- Reversed From/To input is corrected automatically, pagination resets when the period changes, and future ending months are capped at the current business month.
- Validation: `node --check app.js` and `node --test tests/*.test.js` pass (4/4 test files), including custom-boundary and month-over-month regression coverage.

## Revision 29 — Recent Activity + KPI Comparison

- Home Latest sessions now selects and renders the four newest work sessions in descending date/time order.
- Removed the prior randomized rotation so the Recent Work card remains stable and trustworthy.
- Removed repeated Analytics KPI “New activity” text.
- Added compact ↑/↓/→ percentage comparisons against the selected prior period; the prior-period detail line now inherits the same green/red/neutral semantic color.
- Expense increases are shown in restrained red, while expense decreases are green; positive movement for received income, margin, and hours remains green.
- Validation: `node --check app.js` and `node --test tests/*.test.js` pass (4/4 test files).

## Revision 28 — Roadmap Display Cleanup

- Removed the Home “BUILD ROADMAP / Phase 8 — Dashboard & analytics” panel.
- Removed the Home “Phase 8 is now active” status banner.
- Kept the roadmap as project documentation rather than permanent in-app UI; analytics tabs, chart interactions, source traceability, and all data workflows remain unchanged.
- Validation: `node --check app.js` and `node --test tests/*.test.js` pass (4/4 test files).

## Revision 27 — Analytics Interaction Depth

- Business Flow is now inspection-only: tapping or dragging follows the line without opening a month-detail interface.
- Income vs Expenses now has the same touch/pen scrub behavior, with simultaneous income and expense markers and no tap-to-detail transition.
- Added restrained haptic pulses as the scrubber crosses into a new month through the standard browser vibration API. Unsupported browsers continue with visual scrubbing without errors.
- Added a range-aware monthly stacked Expense Category Breakdown using business-use expense amounts and the app's real expense categories.
- Added four-row pagination to Received Income by Source and Expense Mix while leaving their donut summaries based on the complete filtered dataset.
- Changing the Analytics range resets both ranked lists to page one, and every chart/list continues to derive from the same selected range.
- Validation: `node --check app.js` and `node --test tests/*.test.js` pass (4/4 test files).

## Revision 26 — Calendar Badge + Aurora Dim

- Stabilized the day number inside every compact calendar icon with a fixed 18 × 11 px badge, fixed 9 px type, tabular numerals, a consistent line box, and disabled iOS text autosizing.
- Centered one- and two-digit dates within the same internal calendar area so selecting days 1–9 no longer changes or compresses the icon.
- Slightly dimmed Aurora Frost across Client, Expense, Payment, Work Session, Vehicle, Mileage, and Invoice entry surfaces.
- Reduced cyan/lavender wash intensity, saturation, and edge glow while retaining readable text, focus states, and the established glass material.
- Updated the static Safari/iPad frost profile to match the same quieter brightness.
- Validation: `node --check app.js` and `node --test tests/*.test.js` pass.

## Revision 25 — Compact Calendar Controls

- Replaced the six visually large date inputs with one reusable compact calendar control across work sessions, payments, expenses, mileage, and invoice issue/due dates.
- Preserved native date inputs underneath the icon so iPad, iPhone, and desktop browsers continue using their familiar date picker and validation behavior.
- Kept the chosen date visible beside the icon and synchronized invoice due-date text when the issue date automatically changes it.
- Rebalanced the work-session header around a wider Client field, compact Date action, and stable Hourly Rate field; also reclaimed space in payment, expense, mileage, and invoice layouts.
- Added responsive rules for tablet and phone layouts and a compact-calendar regression test.
- Validation: `node --check app.js` and `node --test tests/*.test.js` pass (4/4 test files).

## Revision 24 — Clock & Companion

- Single circular clock beside explicit start/end mode and plain time readouts.
- Undo and five-minute nudge controls; preset undo restores both times.
- Six named presets per workspace/client, with three rows visible in an independently scrollable list. Existing presets retained.
- Preset editor supports naming, start/end entry, and copying current session times.
- Dedicated clock-companion.css must be deployed with the app.
- JavaScript syntax and all three automated test files pass, including six-preset persistence/reload, cap, client isolation and pair undo.
- Browser visual verification could not run: Chromium download failed with network HTTP 502. iPad/Safari appearance and touch interaction still require device review.

## Typography scale refinement

All explicit interface typography has been increased slightly while preserving the existing hierarchy: compact labels receive about +1px, normal interface text about +7%, and large display/title text about +5%. Compact text-bearing controls receive minor breathing-room adjustments to avoid crowding. No business logic or data model behavior changed.

## Corporate Atrium — Records tab extension

- Added Records to the shared atrium activation state and motion/stability profile.
- Styled receipt-vault cards, search/count controls, export action, empty state, and local receipt note as stable smoked-glass surfaces.
- Preserved the established iPad/Safari lite profile by lowering blur on receipt cards and disabling their reflection transforms on touch/Safari.
- No receipt-storage, export, expense-link, or business-logic behavior changed.

## Corporate Atrium lighting refinement

- Increased the visibility of the Home atrium's dynamic light bars without animating the background image.
- Added two independently timed warm architectural-light pairs plus a slower ambient daylight shine.
- Large layers animate opacity only, preserving the Safari/iPad stability profile and avoiding scroll-linked repaint glitches.
- Existing typography/readability polish remains unchanged.

## Corporate Atrium embedded-scene fix

- The approved atrium photograph is now embedded directly in `styles.css` as a data URI. This removes the failure mode where the app silently fell back to the synthetic dark SVG because the nested `assets/atrium-primary.jpg` file was missing, stale, or not uploaded to GitHub Pages.
- Added cache-busting query versions to `styles.css` and `app.js` for deployment testing.
- Reduced synthetic light-rail opacity and global darkening so the actual glass walls, skyline, plants, seating, and reflective marble floor remain clearly visible.
- iPad/Safari keeps the stabilized non-scroll-linked motion profile.

# Phase 4 Expenses Alpha

## Added
- Schema v6 with `expenses` and receipt metadata.
- Business / Mixed / Personal expense classification with preserved original and business-use amounts.
- Fast expense form with workspace-local date, recent-category default, optional work linking, business-purpose note, and Needs Review toggle.
- Optional image/PDF receipts (12 MB max) stored as blobs in IndexedDB.
- Expense edit/delete plus receipt replacement/removal.
- Money → Expenses tab with filters, month totals, business-portion total, and 7-record pagination.
- Records → Receipt Vault with local search and expense drill-down.
- Home Attention integration for expenses needing review.
- Global command search now finds expenses.
- Expense links preserve snapshots when linked clients/sessions are later removed.

## Intentionally not added
- Tax deductibility decisions or tax-form mappings.
- OCR/automatic receipt parsing.
- Bank imports.
- Backup restore/import.
- Receipt bytes inside the JSON backup.

# Phase 3 usability refinement 9

- Added a restrained diagonal shimmer pass to client-tinted detail panels.
- Shimmer is CSS-only, pointer-event transparent, and layered below all card content.
- Animation uses a long 10.5-second cycle with a substantial resting period to avoid visual noise.
- Reduced-motion preferences disable the effect.

# Phase 3 usability refinement 8

- Reworked date-only business logic to use the active workspace timezone instead of UTC. This covers invoice issue defaults, payment dates, work-session date defaults, overdue status, Home “this month” grouping, and local backup filename dates.
- Kept true event/audit timestamps in UTC ISO format for stable traceability.
- Made date-only formatting timezone-neutral so stored calendar dates do not shift when viewed from another device timezone.
- Updated the radial time picker default to use the active workspace timezone as well.
- Client detail panels now inherit the client’s selected color as a subtle background tint/edge treatment. The tint is intentionally softened in both light and dark mode so existing text, metrics, and action buttons keep their contrast.
- No backup restore/import functionality was added in this refinement.

# Phase 3 usability refinement 7

- Replaced click-to-cycle filters with compact anchored filter menus for Sessions, Clients, Invoices, and Payments.
- Client filtering is now functional (`Active`, `Inactive`, `All clients`) instead of a cosmetic control.
- Added 7-record pagination to Invoice History and Money Received, including page count and compact previous/next controls.
- Invoice session selection now offers unobtrusive `Select all · Clear` shortcuts; availability/disabled state follows the current session selection.
- Home `Invoice earnings` now identifies its metric window as `All time`.
- Kept all changes presentation/workflow-level; no accounting entities, schema, or stored financial relationships were changed.

# Phase 3 usability refinement 6

- Rebuilt the Home Recent Work transition as a true layered cross-dissolve instead of a single-container opacity swap.
- The outgoing and incoming session sets now coexist during the animation; old rows dissolve while new rows gradually emerge underneath them.
- Added a subtle blur/softening effect plus small per-row staggering so the transition visibly leaves/removes remnants rather than flashing between DOM states.
- Each dissolve stage is roughly 1.55 seconds with overlap, and the rotation cadence is now about 9 seconds so the animation has enough room to read naturally.
- Hover/focus pause and reduced-motion behavior are preserved.

# Phase 3 usability refinement 5

- Reworked Home Recent Work rotation into a slower two-stage fade rather than a fast flash swap.
- Outgoing session rows now dissolve over ~780 ms before the content changes; the incoming randomized set then fades back in over the same duration.
- Rotation cadence was lengthened slightly so each set remains readable between transitions.
- Reduced-motion behavior remains unchanged: users who request reduced motion get immediate swaps without animation.

# Phase 3 usability refinement 4

- Invoice session selection is now an independently scrollable region (max ~330px / 36dvh) with touch momentum, natural scroll chaining back to the invoice sheet at the top/bottom, and a subtle accent scrollbar. This prevents clients with many sessions from stretching the entire invoice builder and keeps custom line items, notes, and save controls closer at hand.
- Home `Latest sessions` now behaves as a quiet rotating snapshot. Up to four sessions are selected randomly from the twelve most recent records, fade out/in approximately every 6.2 seconds, and avoid immediately repeating the exact same set when possible. Rotation pauses while the app is hidden, another view is active, a modal is open, or the user is actively hovering/focusing the recent-session card.
- Reduced-motion preferences disable the fade animation.

# Build Notes — Phase 3 Payments Alpha

## Main objective

Introduce cash-received records without conflating them with invoice value.

## Phase 3 additions

- Added schema v4 with `payments` as a first-class collection.
- Existing schema v2/v3 local data migrates forward automatically.
- Added invoice-linked payments and direct/other income using one Payment entity.
- Added full/partial payment support.
- Added payment-aware invoice balances and statuses.
- Added invoice-payment history and payment detail records.
- Added payment edit/delete with audit events.
- Added overpayment validation.
- Added payment methods, received date, optional reference, and note fields.
- Added optional direct-income client linking.
- Added Payments ledger and Money tabs.
- Added payment search to global command palette.
- Updated printable invoices to show total, paid, and amount due.
- Added integrity lock: invoices with received payments cannot be rewritten, reverted to Draft, or voided until linked payment records are corrected or removed.

## Accounting-model rule

Invoices represent **billing/amount earned**. Payments represent **cash actually received**. Money dashboard “Received” totals are calculated from Payment records only.

This prevents a common double-counting mistake where both the invoice and the corresponding deposit are treated as received revenue.

## Deferred intentionally

- bank account imports and automatic reconciliation
- payment file attachments / deposit screenshots
- refunds and chargebacks
- payment processing through the app
- accounting-basis / tax-year engine
- receipt ingestion and expense workflows
- secure production cloud database and authentication

These remain later roadmap phases so Phase 3 can be tested independently.

## Phase 3 usability refinement 1
- Work Sessions now paginate at 7 records per page with compact previous/next controls.
- Touch devices can swipe horizontally across the session list to move between pages.
- Session search/filter changes reset pagination to page 1; newly logged work also returns to page 1.
- Sessions table now prioritizes Client before Date.
- Payments ledger now prioritizes Source before Received date.
- Sent and Void invoices have distinct status colors for faster visual scanning.
- Home now includes Invoice earnings based only on actual invoice-linked payments received.

## Phase 3 usability refinement 2
- Home `Uninvoiced work` label now uses the app's warm pending/unpaid semantic color.
- Home `Invoice earnings` label now uses the existing paid/received success green.
- Home hours metric appends `h` for immediate unit recognition.
- Quick Add is vertically centered on tablet/desktop viewports; narrow mobile retains the thumb-friendly bottom-sheet pattern.

## Phase 3 usability refinement 3
- Added client-level color categorization with eight curated, accessible swatches.
- Existing clients receive deterministic starter colors during schema migration; colors can be changed from Edit Client.
- New clients automatically start on the next palette color while keeping one-click color selection.
- Session-table client names inherit the selected client color for faster visual scanning across pages.
- Client cards reinforce the same identity color through the avatar without adding extra labels or controls.
- Money metric chips now follow semantic color language: `Cash in` uses received/success green and `Invoices` on Outstanding uses pending amber.
- Schema advanced to v5 to persist `Client.colorKey`.

## Phase 3 usability refinement 10
- Removed the redundant invoice-builder helper copy stating that only uninvoiced work appears.
- Enlarged `Select all` / `Clear` into compact accent-tinted pill controls for easier tapping and faster large-invoice selection without adding permanent visual clutter.


## Phase 4 usability refinement 1 — collapsible desktop sidebar
- Added a compact sidebar collapse/expand control on desktop/tablet-width layouts above 920px.
- Collapse is a true layout state: the grid sidebar track animates from 260px to 0px and the main workspace expands into the recovered space.
- Sidebar contents fade, soften, and slide away while the edge control remains reachable; expanding reverses the motion.
- The user's collapsed/expanded preference is persisted locally so the layout is restored on the next visit without a visible layout flash.
- Mobile navigation remains unchanged; the collapse control is hidden at 920px and below.
- `prefers-reduced-motion` continues to suppress the animation through the app-wide reduced-motion rule.

## Phase 4 usability refinement 2
- Fresh installs now open on Home with the desktop/tablet sidebar collapsed by default; an explicit saved user preference still wins on later visits.
- The sidebar collapse/expand control now carries a continuous, low-intensity accent-colored edge glow so new users can discover the hidden navigation without adding explanatory text or permanent clutter.
- The sticky top bar no longer uses a hard translucent rectangular fill. It now uses a masked gradient/backdrop-blur veil that fades naturally into the page below, preserving search/control legibility while making scroll transitions feel substantially more fluid.
- Mobile navigation behavior remains unchanged, and reduced-motion settings effectively suppress the rotating glow animation.

## Phase 4 usability refinement 3
- Reworked the sticky top utility veil after iPad testing showed that full-width `backdrop-filter` blur caused bright text/cards underneath to bloom into a conspicuous gray band.
- The topbar now uses a short, page-colored alpha gradient with no full-width backdrop blur. Search/profile controls keep their own surfaces, so readability remains protected while scrolling without smearing underlying content.
- Reduced the veil extension below the 72px topbar from 34px to 18px so the transition returns to the document sooner and feels less like an overlay panel.

## Corporate Atrium Home Rebuild — fidelity reset

### Stability pass addendum
- Bundled a local atrium background plate (`assets/atrium-primary.jpg`).
- Disabled scroll-driven scene motion and moved touch/Safari devices to a lighter, more stable visual profile.
- Reduced backdrop blur and removed the heaviest secondary layer effects on lite-profile devices.


This build intentionally restarts the Corporate Atrium visual layer from the clean Phase 4 Usability Refinement 3 base rather than patching the earlier teal/blurred attempts.

### Home-only visual changes
- Added an explicit fixed environment DOM layer behind the live application instead of hiding the scene inside pseudo-elements.
- The physical office environment stays sharp outside UI glass. `backdrop-filter` is applied locally to Home cards/panels only.
- Added responsive real-office environment plates for widescreen and tablet/mobile compositions, with a packaged `assets/atrium-fallback.svg` for offline/failure fallback.
- Added subtle warm architectural light rails, floor reflection treatment, edge vignette, and optional decorative atrium typography in wide layouts.
- Home cards use lighter smoked-glass material, local text-protection gradients, environment-positioned reflection highlights, semantic color casting, and restrained hover elevation.
- Pointer/touch movement and scroll update CSS variables for shallow multi-layer parallax and moving glass reflections. Reduced-motion freezes those effects.
- The Home topbar and expanded sidebar adopt the same glass/material system while the non-Home sections retain the prior Phase 4 theme.
- Existing Home data, Recent Work random crossfade, Attention actions, Quick Add, search, sidebar collapse, and navigation behavior are unchanged.

### Explicitly still deferred
- Walking background person / people animation.
- Randomized ambient background events.
- Propagating Corporate Atrium styling to Work, Money, Records, sheets, invoice builder, expense forms, or detail panels.
- Backup restore/import.


## Corporate Atrium — Work tab alpha
- Extended atrium activation from Home to Home + Work only.
- Added Work-specific glass styling without changing data flow or interactions.
- Kept session/client color/status semantics intact.
- Preserved iPad/Safari stability by reducing blur on the large data table and client-card surfaces under the lite profile.
- Money and Records are intentionally unchanged.

## Corporate Atrium — Money tab

- Extended the proven Home + Work Corporate Atrium scene to the Money view without changing invoice, payment, or expense business logic.
- Money now shares the same embedded atrium plate, stable iPad/Safari lighting profile, and subtle dynamic architectural lighting.
- Money-specific surfaces (metric cards, invoice/payment/expense ledgers, filters, pagination, and actions) use dense smoked glass with semantic green/amber/red casts.
- Invoice/payment/expense modals and detail sheets remain on the existing Phase 4 modal treatment for now; only the Money tab itself was themed in this pass.

## Frosted Window Bays Alpha
- Selected design direction implemented across Home, Work, Money, and Records main-tab surfaces.
- Replaced the prior dark smoked-card treatment with cool architectural frosted panes.
- Removed whole-card semantic washes from metric surfaces; semantic colors remain in labels/chips/statuses.
- Large Work/Money ledgers use a denser frosted bay for scanning, while still showing the atrium through the surface.
- Records receipt cards, controls, and notes use the same bay material.
- iPad/Safari keeps the proven static atrium runtime profile with reduced blur cost and increased pane opacity.
- No changes to domain logic, persistence, invoices, payments, expenses, receipts, or modal/detail flows.

## Safari viewport / first-scroll stability
- Locked the Corporate Atrium scene to a stable `100lvh` canvas where supported, with a `100vh` fallback.
- Replaced `position:fixed; inset:0` on the scene with explicit top/left/width/height so Safari toolbar collapse does not recompute the scene from a changing bottom edge.
- Themed view minimum heights now use `100svh` where supported to avoid layout-height jumps while Safari chrome changes size.
- Height-only `resize` events are ignored by the atrium JS runtime; width changes still refresh the profile for rotation/Split View.
- No changes to business data, calculations, tab behavior, frosted-window materials, or background artwork.


## Comprehensive pill visibility pass
- Extended high-contrast treatment beyond status-pill to muted-chip and quiet-badge surfaces.
- Strengthened Money summary semantic pills: Cash in (green), Invoices (amber), Attention/Overdue (red).
- Strengthened small counts inside segmented controls.
- Safari/iPad keeps solid local color without adding live blur.


## Phase 5 — Taxes / Mileage + Vehicles Alpha
- Added fifth permanent navigation destination: Taxes.
- Advanced local schema to v7 with `vehicles` and `mileageTrips`.
- Added vehicle profiles, primary-vehicle invariants, mileage source records, filters, pagination, details, edit/delete flows, and audit events.
- Added client/session linkage plus snapshots; deleting linked work no longer destroys mileage context.
- Added mileage review items to Home Attention and mileage/vehicle results to global search.
- Added Quick Add → Mileage.
- Added Corporate Atrium / Frosted Window Bays styling for Taxes, with Safari/iPad static-frost no-flash treatment.
- Added responsive mileage ledger and vehicle-card layouts, including a six-control mobile bottom bar (five destinations plus Quick Add).
- Explicitly does not calculate tax deductions or mileage rates; those remain Phase 6 concerns.


## Phase 5 surface readability refinement
- Slightly increased opacity of the Frosted Window Bay surfaces across Home, Work, Money, Taxes, and Records.
- Kept the change deliberately modest so the Corporate Atrium remains visible.
- Increased density proportionally: long ledger surfaces are a little stronger than smaller cards; compact text-bearing controls receive only a small lift.
- Preserved the iPad/Safari no-flash profile by using denser static frost rather than reintroducing live backdrop blur.
- No business logic or data-model changes.

## Phase 6 — Tax Layer
- Schema advances to v8; Phase 7 data migrates without changing source transactions.
- Taxes now opens on Overview with a tax-year selector derived from years present in Payments, Expenses, Mileage, plus the current workspace year.
- Received income is derived from Payments by received date. Recorded business expenses use each Expense's existing business-use amount.
- Added a standard-mileage planning scenario. Built-in IRS business mileage rates: 2024 67¢, 2025 70¢, 2026 Jan–Jun 72.5¢, 2026 Jul–Dec 76¢. Rates apply by trip date.
- Planning profit intentionally excludes recorded Vehicle & fuel operating costs when the standard-mileage scenario is used, preventing obvious stacking of alternative vehicle methods. Parking & tolls remain separately represented.
- Added tax readiness queue, quarterly received-income view, deductions/category rollup, vehicle-method comparison context, and source navigation back to Money.
- Quarterly area is explicitly planning groundwork, not a calculated federal/state tax liability.
- Tax calculations are derived views only; Payments, Expenses, Mileage, Vehicles, and Receipts remain source records.

## Home + Money depth hierarchy refinement
- Home: kept the upper status/metric Frosted Window Bays unchanged; changed the lower Attention, Recent Work, and Roadmap containers to the deeper charcoal-blue material already established by the Taxes overview detail cards.
- Money: kept the upper summary metrics and Invoices/Payments/Expenses switcher unchanged; changed the lower active ledger container to the deeper Taxes-style detail material. The explanatory footer uses a quieter version of the same depth family.
- Work and Records were intentionally not changed.
- The `atrium-lite` iPad/Safari path continues to use static frost with no live `backdrop-filter`.
# Build Notes — Phase 7 Traceability / Evidence

- Added compact drill-through from tax income, non-vehicle expense, mileage, and quarterly summaries to the exact source records behind each number.
- Evidence views reconcile their displayed total from the same source collections used by Phase 6 and open directly into the existing Payment, Expense, or Mileage detail flow.
- Added collapsible per-record history to Invoice, Payment, Expense, Mileage, and Work Session details without adding a permanent destination or extra everyday controls.
- Advanced local schema to v9 with `evidenceSnapshots`. New deletions preserve a structured final snapshot and retain prior audit events instead of erasing the record trail.
- Preserved the authoritative event model: invoices remain billed/earned, payments remain received cash, expenses remain money out, and mileage remains a source fact interpreted by tax views.
- Motion is restrained, reduced-motion aware, and avoids new backdrop-filter layers for iPad/Safari stability.
# Build Notes — Phase 8 Dashboard / Analytics

- Expanded Home with a contextual Snapshot / Analytics switch instead of adding another permanent navigation destination.
- Added Last 3 months, Last 6 months, Last 12 months, Year to date, and All time ranges. KPIs compare against the adjacent prior period; Year to date compares against the same elapsed period in the prior year.
- Added four derived KPIs: received income from Payments, business-use expenses from Expenses, planning margin, and hours from Work Sessions.
- Added monthly business-flow trends, monthly work rhythm, received-income and workload breakdowns by client/source, business-use expense categories, and invoice collection health.
- Every metric, month, ranking row, category, and invoice state opens a reconciled evidence view linked to the exact source Payment, Expense, Work Session, or Invoice records.
- Analytics are read-only derived views. No Phase 8 collection, schema migration, duplicated transaction, or stored aggregate was introduced.
- Used inline, accessible SVG charts with keyboard-enabled data points and no external chart dependency.
- Added responsive two-column-to-single-column layouts, bounded ranking lists, touch scrolling, reduced-motion behavior, and static-frost compatibility for iPad/Safari.
# Phase 8 — Analytics Chart Refinement

- Replaced the former Hours / unbilled value chart with a range-aware Income vs Expenses comparison using smooth monthly lines and restrained area fills.
- Reframed Business Flow as monthly net movement: received Payments minus saved business-use Expense amounts.
- Added a proportional currency Y-axis to both monetary charts, including a visible zero line and negative values when expenses exceed received income.
- Added pointer/finger scrubbing to Business Flow. Its indicator follows the actual curved SVG path continuously, while the tooltip resolves to the nearest monthly source bucket.
- Prevented drag gestures from accidentally opening evidence; ordinary taps and keyboard activation still drill into the selected month.
- Added compact income-source and expense-category donut charts beside the existing exact-value rankings. More than five slices are grouped visually as Other while the underlying ranking remains complete.
- Donut slices remain traceable and open the exact Payment or Expense records represented by the selected slice.
- All charts, pies, KPIs, rankings, and evidence predicates use the single top-level Analytics range selection.
- No transaction model, stored aggregate, or schema behavior changed.

# Entry Memory + Expense Categories

- Added workspace-specific remembered defaults for recurring creation flows: expense classification/category, payment type/method, session client/time, invoice client, mileage class/vehicle, client color/status, and vehicle status.
- Defaults update only after a successful new record. Cancelled forms and edits do not unexpectedly change the next-entry state.
- Explicit context continues to win—for example, opening a payment from an invoice selects that invoice regardless of the remembered payment type.
- Replaced the new-expense category menu with Food, Gas, Parking, Car, Subscriptions, Misc, Fees, and Work Equipment.
- Preserved legacy category labels and historical rollups without rewriting existing Expense source records.
## Revision 7 — Quick Receive payment composer

- Replaced the long payment form with the same calm, compact Smart Compose language used by expenses.
- Added optional local parsing for `amount from payer via method`, with editable interpreted fields and a narrow recognized-method list.
- Kept payment type, date, and invoice linkage explicit; no accounting classification or invoice relationship is inferred.
- Preserved invoice outstanding-balance limits, received-money traceability, remembered type/method defaults, and all stored payment fields.
- Added responsive two-column behavior for phone/iPad widths without changing the Atrium scene or Home analytics wiring.
## Revision 8 — clearer gold segment borders

- Increased only the gold border's thickness, contrast, glow, and moving highlight visibility on the four segmented navigation bars.
- Preserved the existing frosted-gray interiors, active states, sizing, and surrounding layout.
- Kept the shimmer restrained and disabled its motion when reduced-motion is requested.

## Revision 9 — Calendar Sweep invoices

- Rebuilt Create/Edit Invoice around a client-filtered monthly calendar while preserving the existing invoice and session source records.
- Calendar work labels stay compact and show the aggregate hours and earned value for that client on each date; their color follows the client's saved color.
- Added touch/pointer sweeping across workdays, individual selection in the adjacent session list, Select all/Clear shortcuts, and live session/hour/total summaries.
- New invoices show only uninvoiced sessions. Editing keeps sessions already attached to that invoice available while continuing to exclude sessions attached to other invoices.
- Changing clients after selecting work now requires confirmation and clears the prior selection, preventing sessions from different clients from being mixed accidentally.
- Kept custom line items, notes/terms, invoice numbering, issue/due dates, immutable invoice snapshots, payment protections, and edit behavior intact.
- Added responsive iPad/phone layouts, reduced-motion handling, and Calendar Sweep coverage to the reusable smoke test.

## Revision 10 — Money shortcut + reliable calendar taps

- Replaced the Money-header Invoice Settings button with a persistent `＋ Expense` shortcut; the existing Expenses sub-tab shortcut remains available.
- Kept Invoice Settings in the overall Settings sheet, avoiding a duplicate high-level control without removing the feature.
- Fixed touch calendar taps being immediately toggled a second time by the browser's synthesized click event.
- Preserved pointer/finger sweep selection, mouse clicks, keyboard activation, client filtering, and live invoice totals.

## Revision 11 — Paired work clocks + client quick times

- Rebuilt Add/Edit Work Session around independent start and end clock faces with five-minute pointer snapping, AM/PM controls, and keyboard adjustments.
- Added a live session-length and estimated-value summary without creating or storing a second financial calculation.
- Added exactly three reusable start/end quick-time slots per client. Filled slots apply both times in one tap; each slot can be created, edited, replaced, or removed inline.
- Scoped quick times by workspace and client in a separate local preference key. Switching clients uses a short fizzle transition and never rewrites work sessions or other source records.
- Preserved the authoritative session fields, hourly-rate snapshot, overnight-duration behavior, invoiced-session protections, audit behavior, and remembered successful-entry defaults.
- Added responsive iPad/phone layouts, reduced-motion handling, accessible clock sliders, and smoke-test coverage for per-client switching, application, and persistence.

## Revision 12 — Unified session surface + fluid clock dragging

- Moved client, date, hourly rate, both clocks, three quick-time slots, live totals, and the optional note into one continuous session container and background treatment.
- Reworked pointer tracking so a finger can rotate either clock smoothly instead of relying on isolated taps.
- Updates the selected time, AM/PM state, duration, and estimated value live during a drag, still snapping to five-minute increments.
- Added pointer capture plus document-level fallback tracking so movement remains stable near and beyond the dial edge on touch browsers.
- Preserved tap selection, keyboard adjustment, per-client preset transitions, authoritative session fields, overnight durations, and invoice protections.

## Revision 13 — Integrated session console

- Reworked the unified container into a single composed console rather than a collection of cards placed inside another card.
- Joined Client, Date, and Hourly Rate into one continuous upper control rail with shared dividers and inset input wells.
- Turned the three quick-time presets into one segmented bridge between the clock faces, with shared framing instead of three floating buttons.
- Made AM/PM controls, live totals, and the optional note visually flush with the same internal architecture.
- Preserved circular clock dragging, five-minute snapping, per-client preferences, responsive ordering, and the underlying session record model.

## Revision 14 — Single-surface session sheet

- Removed the remaining framed console beneath the session title, eliminating the modal-within-a-modal appearance.
- Made the sheet itself the sole outer container for the title, close control, metadata rail, clocks, quick times, totals, note, and actions.
- Retained internal dividers and subtle material changes only where they improve scanning; no secondary outer border or rounded container remains.
- Preserved circular dragging, five-minute snapping, responsive layouts, client presets, validation, and record integrity.

## Revision 15 — Lighter integrated session sheet

- Removed the separate footer-bar treatment around Cancel and Save Session; actions now sit directly on the same continuous sheet material.
- Shifted the full session interface toward a lighter graphite-blue glass palette without turning it bright or reducing text contrast.
- Brightened the header, metadata rail, clock wells, quick-time bridge, totals, note field, dividers, and control borders as one coordinated system.
- Preserved all clock gestures, quick-time behavior, responsive layouts, validation, and source-record integrity.

## Revision 16 — Integrated invoice console

- Applied the work-session console approach to Create/Edit Invoice with one continuous outer surface and a coordinated lighter graphite-blue palette.
- Joined Client, Invoice Number, Issue Date, and Due Date into one metadata rail with shared dividers and inset controls.
- Removed separate card framing from the calendar, session-review column, custom items, note/terms, totals, and action footer.
- Converted the session-review list and invoice totals into integrated segmented rails while retaining clear selection affordances.
- Preserved Calendar Sweep gestures and taps, client filtering, client colors, custom line items, notes, numbering, totals, immutable snapshots, and payment protections.

## Revision 17 — Quick Rail console

- Replaced the six separate Quick Add cards with one compact, shared segmented rail inside a lighter graphite-blue glass sheet.
- Removed redundant “Active” labels and nested icon tiles so all six choices scan as one calm, continuous control.
- Added restrained gold, periwinkle, and mint icon accents, shared dividers, integrated hover/focus feedback, and responsive three-by-two/two-by-three rail layouts.
- Preserved all six existing creation routes and their underlying forms, validation, defaults, and source-record behavior.

## Revision 18 — Integrated Client + Vehicle forms

- Applied the lighter graphite-blue single-surface system to New/Edit Client and New/Edit Vehicle.
- Integrated each form's title, fields, helper text, optional sections, primary-vehicle control, and actions into one continuous sheet rather than stacked inner panels.
- Kept normal inputs as restrained inset wells while dissolving the heavier Billing Details and footer containers into shared dividers and material.
- Preserved client colors, remembered defaults, billing details, rates, vehicle status, odometer, primary-vehicle behavior, validation, editing, and source-record integrity.
# Phase 8 revision 19 — Destination Route Console

- Replaced the manual mileage-entry grid with a destination-first route console.
- Added a continuous glowing blue route ribbon with gentle idle movement and interpolated shape changes when either location changes. Animation is cleaned up on close and suspended when hidden; Reduced Motion disables movement.
- Added destination suggestions from active clients and previously saved locations.
- No automatic routing provider is connected in this frontend revision. New routes remain explicitly unresolved and cannot be saved. Existing trips preserve their recorded distance only when the route labels remain unchanged; no mileage is inferred from labels.
- Kept MileageTrip storage, evidence, audit, vehicle snapshots, tax calculations, and client/session relationships intact.
- Added a lighter one-frame sheet treatment plus reduced-motion and iPad/Safari-safe animation behavior.

Validation: JavaScript syntax check and both Node test suites pass (existing analytics/entry regressions plus focused mileage animation, lifecycle cleanup, reduced-motion, and stored-distance checks). Browser visual verification was unavailable because the browser download timed out. Device-level Safari smoothness remains to be verified on hardware.
## Phase 8 — Revision 22: Aurora Frost entry-console extension

- Extended the Aurora Frost visual treatment to work-session, invoice, mileage, and vehicle entry surfaces.
- Kept structure, dimensions, controls, data flow, validation, and interactions unchanged.
- Added consistent luminous edge treatment, cool glass gradients, readable muted text, focus states, and static Safari/iPad fallback behavior.
## Phase 8 — Revision 23: session console composition

- Rebalanced the work-session console around the single clock so the supporting controls stay in the same working area.
- Converted quick presets into a compact three-slot rail and improved the preset editor with clearer start/end entry and actions.
- Preserved all session data, clock gestures, quick-time scoping, validation, and calculations.
