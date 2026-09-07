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
