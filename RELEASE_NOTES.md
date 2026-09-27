# Simple Mode Complete V12 Planner Shortcut release notes

## V12 — Planner Shortcut

- Replaced the duplicate top-right profile/settings control with a gold notebook Planner shortcut.
- Removed Planner from the sidebar and mobile tab strip while retaining Settings in the sidebar.
- Strengthened edit and completion-control edges and fills.
- Added a distinct mid-dark surface behind completed plans and increased archived-text contrast.

## V11 — Planner Contrast

- Added a dark Money-style Agenda surface against the lighter notes panel.
- Enlarged and strengthened calendar, event, and task typography.
- Added clearer mint and gold treatments to completion and edit controls.
- Fixed the misleading checkmark appearance caused by sticky iPad hover/focus state after list reflow.

## V10 — Planner Polish

- Added clean eight-item pagination to Recently completed.
- Added in-place Planner editing from a compact pencil control.
- Prevented touch/click rollover from completing the next task after a re-render.
- Lightened Planner surfaces to match the Sessions Frosted Window Bays material.
- Removed the decorative check-mark artifact from the Home Attention panel.

## V9 — Sessions Theme Planner

- Retired the separate Obsidian panel treatment from Planner.
- Reused the Sessions tab's shared Frosted Window Bays material so Planner, Sessions, and the surrounding Work workspace read as one cohesive interface.
- Added equivalent WebKit lite and narrow-screen material rules while leaving Planner structure and interactions unchanged.

## V8 — Brighter Obsidian

- Brightened Plans and Agenda one additional step while preserving translucency.
- Maintained the established light-left/dark-right hierarchy and existing content contrast.
- Matched the revised tones across standard glass, WebKit lite, and stacked narrow-screen modes.

## V7 — Bright Obsidian

- Lifted the luminance of both Planner panels while retaining the V6 transparency levels.
- Preserved Agenda as the darker pane, but replaced near-black values with brighter architectural graphite.
- Matched the adjustment across standard glass, WebKit lite, and stacked narrow-screen modes.

## V6 — Translucent Obsidian

- Reduced the opacity of the connected folio and both Planner panels to restore more of the app's atrium-through-glass character.
- Kept the Agenda visually grounded while allowing architectural light and background detail to remain perceptible.
- Applied separate transparency levels for standard blur, WebKit lite mode, and stacked narrow-screen panels.

## V5 — Obsidian Mirror

- Re-skinned the Planner with the selected smoky graphite, matte obsidian, platinum, and restrained champagne visual direction.
- Preserved the connected-folio geometry, five-item scrolling threshold, plan interactions, agenda grouping, and deadline recognition exactly.
- Added dedicated low-power WebKit and narrow-screen treatments so the new surface remains visually consistent without requiring expensive blur effects.

## V4.1 — Planner refinement

- The Plans list now keeps five open items visible and becomes independently scrollable when additional items are added.
- Natural deadline recognition now supports full and abbreviated month names, ordinal dates, reversed day/month phrasing, numeric dates, and ISO dates.
- Dates without a written year roll into the next year only when that calendar date has already passed; impossible dates are ignored.

## V4 — Planner folio

- Added a temporary fifth Planner navigation destination on desktop and mobile.
- Implemented the selected connected-folio layout with a calm plans column and a substantial agenda column.
- Added optional deadline recognition and confirmation for natural phrases such as “tomorrow” and weekday names.
- Added quiet client-name recognition, upcoming work-session aggregation, Home attention routing, global search results, one-click completion, restoration, and a 30-day completed archive.
- Advanced the local schema to version 10 while retaining schema-version 9 compatibility.

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
