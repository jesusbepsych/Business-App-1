# Smart Compose expense entry

Concept 6 applied to new and existing expenses; navigation and other entry forms remain unchanged.

- Smoked-glass surface, large optional quick-entry input, compact editable fields, mint save action.
- Enter `$40 at Shell` or `1,234.56 at Store`. Parsing runs locally and fills amount and merchant only. Category, use and date remain under your control; saved category/use defaults are preserved.
- Malformed nonempty quick entry blocks submission rather than saving stale interpreted values. Clear quick entry or edit amount/merchant directly to return to manual entry.
- Receipts, purpose, links, descriptions and review controls remain available under “Add receipt or details.” Existing details expand when present.
- Mixed-use business portion stays visible and is validated by the existing saving logic. Existing legacy categories and receipt replacement/removal remain supported.
- No new services, dependencies, schema changes, or sample records are added to the app.

Validation: `node --check app.js` and `node tests/analytics-smoke.test.js` pass. The smoke test covers analytics, remembered defaults, compose parsing, malformed input, manual overrides and mixed-use controls. It uses a fake DOM, not a browser. Browser rendering and actual iPad/Safari behavior have not been verified in this environment because the browser download timed out.

Suggested device check: create a personal gas purchase; reopen to check remembered use/category; edit the amount; create a mixed-use purchase with a business portion; attach and replace a receipt; open another entry form to confirm its original styling. Check both portrait and landscape and with the keyboard open.
