# Simple Mode Complete V1 release notes

## User-facing changes

- Settings now describe the current on-device behavior without prototype or future-feature language.
- The inactive notification control was removed.
- The obsolete local-owner footer identity was removed and the sidebar spacing closes naturally around Settings.
- Receipt storage and JSON backup limitations are stated directly.
- Payments can be explicitly marked **Needs review** and later **Mark verified** from payment details.

## Internal consolidation

- `index.html` loads canonical `app.js` and `styles.css` files with a V1 cache key.
- Duplicate revision-named browser assets were retired from this release package.
- Dead prototype branding, sync-card, and profile CSS was removed.
- Existing token variables continue to centralize color, spacing, radii, shadow, and motion behavior.
- Data repository, financial calculations, rendering functions, and event bindings remain organized as distinct sections of the canonical script, avoiding a risky behavioral rewrite at the V1 boundary.

## Compatibility

- Existing schema-version 9 browser data remains loadable.
- Retired vehicle and mileage arrays remain inert compatibility fields so older saved workspaces are not destructively rewritten.
- No calculation, navigation, analytics, filtering, or classification behavior was changed.
