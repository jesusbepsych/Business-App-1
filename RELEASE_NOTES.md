# Simple Mode Complete V3 release notes

## V3 — WebKit regression hardening

- Added an automated WebKit pass covering iPad portrait, landscape, and split-view layouts.
- Removed a WebKit-incompatible `content-visibility` optimization that could leave scrolled client cards transparent even after their reveal state was applied.
- Preserved the progressive scroll fade, reduced-motion behavior, card styling, and client-list structure.
- Added touch navigation, multi-select filtering, overlay bounds, analytics expansion, persistence, browser-error, and horizontal-overflow checks.

## V2 — progressive client libraries

- Client lists with seven or more visible cards now reveal cards when they approach the viewport.
- Cards cleanly fade and rise into place while scrolling in either direction.
- Cards outside the viewport return to their prepared state, allowing the same smooth reveal when scrolling back.
- Short per-column staggering keeps each row readable without slowing navigation.
- V2 originally used `content-visibility` and an intrinsic card height; V3 retires that optimization because WebKit can suppress the reveal paint.
- Reduced-motion preferences and browsers without observation support bypass animation and show cards immediately.

## V1 foundation

- Settings now describe the current on-device behavior without prototype or future-feature language.
- The inactive notification control was removed.
- The obsolete local-owner footer identity was removed and the sidebar spacing closes naturally around Settings.
- Receipt storage and JSON backup limitations are stated directly.
- Payments can be explicitly marked **Needs review** and later **Mark verified** from payment details.

## Internal consolidation

- `index.html` loads canonical `app.js` and `styles.css` files with the current V3 cache key.
- Duplicate revision-named browser assets were retired from this release package.
- Dead prototype branding, sync-card, and profile CSS was removed.
- Existing token variables continue to centralize color, spacing, radii, shadow, and motion behavior.
- Data repository, financial calculations, rendering functions, and event bindings remain organized as distinct sections of the canonical script, avoiding a risky behavioral rewrite at the V1 boundary.

## Compatibility

- Existing schema-version 9 browser data remains loadable.
- Retired vehicle and mileage arrays remain inert compatibility fields so older saved workspaces are not destructively rewritten.
- No calculation, navigation, analytics, filtering, or classification behavior was changed.
