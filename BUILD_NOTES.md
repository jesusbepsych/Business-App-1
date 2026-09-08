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

