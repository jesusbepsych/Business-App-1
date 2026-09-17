# Smart Compose expense and payment entry

The shared fast-entry language now covers expenses and received payments; navigation and unrelated entry forms remain unchanged.

- Smoked-glass surface, large optional quick-entry input, compact editable fields, mint save action.
- Enter `$40 at Shell` or `1,234.56 at Store`. Parsing runs locally and fills amount and merchant only. Category, use and date remain under your control; saved category/use defaults are preserved.
- Malformed nonempty quick entry blocks submission rather than saving stale interpreted values. Clear quick entry or edit amount/merchant directly to return to manual entry.
- Receipts, purpose, links, descriptions and review controls remain available under “Add receipt or details.” Existing details expand when present.
- Mixed-use business portion stays visible and is validated by the existing saving logic. Existing legacy categories and receipt replacement/removal remain supported.
- No new services, dependencies, schema changes, or sample records are added to the app.

## Quick Receive payment entry

- Enter `$750 from Jordan via Zelle`, `1,250.50 from Acme Studio via direct deposit`, or omit `via …` to retain the currently selected method.
- Parsing is local and deliberately narrow. It fills only amount, payer/source, and a recognized payment method; it never guesses whether the money is other income or an invoice payment.
- Type, date, and invoice linkage remain editable and explicit. Switching to Invoice payment exposes only unpaid sent invoices, preserves the existing overpayment guard, and requires the user to choose the invoice.
- Client, description, reference, note, and the received-money traceability explanation remain under “Link invoice or add details.”
- Manual amount, payer, method, or invoice edits hand control back to the regular fields and clear the quick-entry sentence.

Validation: `node --check app.js` and `node tests/analytics-smoke.test.js` pass. The smoke test covers analytics, remembered defaults, both compose parsers, malformed input, manual overrides, explicit payment type/invoice behavior, and mixed-use controls. It uses a fake DOM, not a browser.

Suggested device check: create a personal gas purchase; reopen to check remembered use/category; edit the amount; create a mixed-use purchase with a business portion; attach and replace a receipt; open another entry form to confirm its original styling. Check both portrait and landscape and with the keyboard open.

## Atrium and Analytics recovery

The packaged `styles.css` had been truncated at an exact byte boundary before the Corporate Atrium rules completed. It has been rebuilt from the complete, previously working Phase 8 chart-refinement stylesheet, then the Smart Compose rules were applied as an isolated addition. This restores the original embedded photographic scene, all Atrium/Safari profiles, the Home tab visibility rules, and the complete chart/pie/scrubber styling without depending on a separate recovery layer.
