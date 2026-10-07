# vasilico.ru — GitHub Pages static site

- Preserve the existing design, large readable text, visible menu and direct contact buttons.
- `pricing-data.js` is the single authoritative source for all price amounts and replacement bundles. Do not duplicate prices in app.js or landing-page content.
- `pricing-pages.js` renders the separate calculator and service price page using that data. `calculator.js` handles choices and validated URL presets.
- After any pricing, page-renderer, article or navigation edit, run `node scripts/build-static.mjs` and commit the regenerated HTML together with the source changes. This rebuilds visible static prices and JSON-LD. Do not publish source-only price edits.
- Keep `/ceny/#calculator` working. Keep verification files and Google ownership meta tags intact.
- Before publishing, check JS syntax and exercise calculator presets, add/remove, optional trip, and mobile layout. Never invent rates for tasks missing from the price list.
- Deploy through this GitHub Pages repository. Do not move the site back to chatgpt.site.
