## Corporate Atrium — Work tab extension

- The proven Home atrium environment is now also active on the Work tab.
- Work keeps its existing Sessions/Clients structure and functionality, but its heading, actions, segment control, search/filter controls, session table, pagination, and client cards now use the same smoked-glass/material system.
- The existing subtle architectural-light animation continues on Work without moving the large background image.
- Safari/iPad retains the lite rendering profile with reduced blur on large Work surfaces for smooth scrolling.
- Money and Records remain on the prior theme for now.

## Corporate Atrium embedded-scene fix

- The approved atrium photograph is now embedded directly in `styles.css` as a data URI. This removes the failure mode where the app silently fell back to the synthetic dark SVG because the nested `assets/atrium-primary.jpg` file was missing, stale, or not uploaded to GitHub Pages.
- Added cache-busting query versions to `styles.css` and `app.js` for deployment testing.
- Reduced synthetic light-rail opacity and global darkening so the actual glass walls, skyline, plants, seating, and reflective marble floor remain clearly visible.
- iPad/Safari keeps the stabilized non-scroll-linked motion profile.

## Stability pass highlights

- Replaced third-party atrium image dependency with a bundled local background asset so Home no longer depends on remote image hosts.
- Removed scroll-linked atrium motion and added an automatic lite profile for iPad/Safari/coarse-pointer environments to reduce shimmer and static during scrolling.
- Reduced blur and glass complexity on the Home scene for more stable rendering while preserving the atrium look.

# Business Ledger — Phase 4 Expenses Alpha

This checkpoint activates the outgoing-money side of Business Ledger while preserving the existing Client → Session → Invoice → Payment architecture.

## Active workflows

- Multi-workspace business/gig separation
- Clients with visual color identities
- Work sessions with rate snapshots and 5-minute radial time entry
- Invoices, partial/full payments, and direct income
- Expenses with Business / Mixed / Personal use classification
- Separate original total and business-use amount
- Bookkeeping categories including supplies, vehicle/fuel, parking/tolls, phone/internet, software, training, insurance, marketing, meals, fees, equipment, and other
- Business-purpose notes and optional client/session linking
- Needs Review queue integrated with Home Attention
- Optional receipt image/PDF attachment
- Receipt Vault in Records with merchant/category/file search
- Direct filter menus and 7-record pagination across long financial lists
- Workspace-local date logic using America/Los_Angeles for Play It Forward

## Receipt storage

Structured financial records remain in browser localStorage through the versioned LocalRepository. Receipt file bytes are stored separately in browser IndexedDB so image/PDF data is not embedded in the expense JSON.

This remains a local prototype. Do not treat it as secure production storage for sensitive client or tax documents yet.

The current JSON backup contains the structured expense and receipt metadata, but **does not package the receipt file bytes**. Restore/import is still intentionally deferred.

## Expense design rules

- `totalCents` records what was actually spent.
- `businessCents` records the business-use portion without destroying the original amount.
- Business classification = 100% business portion.
- Personal classification = $0 business portion.
- Mixed classification requires a business portion between $0 and the total.
- Expense category is bookkeeping context, **not a tax deduction decision**.
- A missing business-purpose note on Business/Mixed entries automatically sends the expense to Needs Review.
- Receipts are optional and remain evidence linked to the expense rather than determining the accounting amount.

## Suggested Phase 4 test

1. Add a Business expense with a purpose and no receipt.
2. Add a Mixed expense and verify the business portion cannot exceed/equal the total.
3. Add a Personal expense and confirm its business portion remains $0.
4. Attach an image or PDF receipt and confirm it appears in Records → Receipt Vault.
5. Edit the expense and replace/remove the receipt.
6. Mark an expense Needs Review and confirm it appears on Home → Attention.
7. Mark it reviewed from the expense detail panel and confirm it disappears from Attention.
8. Link an expense to a client/session and verify the context appears in expense detail.
9. Test the Expenses filter and pagination with more than seven records.
10. Search receipt file names/merchants/categories from Records.
11. Refresh the browser and verify the structured records and local receipt remain available.

## Deferred by design

- Backup restore/import
- Mileage and vehicles (Phase 5)
- Tax deduction logic / Schedule C mapping (Phase 6)
- Full evidence/audit drill-down (Phase 7)
- Bank transaction importing and reconciliation (Phase 11)
- Secure cloud authentication/sync and encrypted file storage

## Phase 4 usability refinement 1
Desktop/tablet layouts now support an optional collapsible left sidebar. Use the small edge chevron to collapse the navigation; the sidebar fades/slides away and the main workspace expands to use the reclaimed width. Press the same control again to restore the full sidebar. The preference is stored locally. Mobile bottom navigation is unchanged.

### Refinement 2 — default collapsed navigation + fluid top bar
On a fresh desktop/tablet visit, Business Ledger opens on Home with the sidebar collapsed to maximize usable workspace. The edge chevron remains visible with a subtle traveling accent glow as a discoverability cue. Once the user expands/collapses it, that preference is saved locally for later visits. The sticky top utility area now fades into the page with a gradient blur rather than presenting as a hard translucent rectangle while scrolling.

### Top utility blending
The sticky search/profile region intentionally avoids applying a full-width backdrop blur. A short page-colored fade now protects control readability while allowing bright underlying text and cards to pass beneath without turning into a broad gray haze.

## Corporate Atrium Home prototype
The Home view now uses the Corporate Atrium visual system while the rest of Phase 4 remains visually unchanged for A/B review. The environment uses remote Unsplash image plates with a bundled SVG fallback. Unsplash source references used for the prototype environment:
- E Vos — “Modern office interior with glass walls and walkways” (Unsplash, free under the Unsplash License).
- Fer Troulik — “Modern office interior with glass walls and reflections” (Unsplash, free under the Unsplash License).

No people animation or randomized ambient events are active in this build.
