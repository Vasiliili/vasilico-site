# Borehole pump replacement and first selection

Standalone static route: /podbor-skvazhinnogo-nasosa/. Preserve GitHub Pages, shared site header/palette, direct contacts, search and water-entry animation.

## Owner's practical workflow

Default entry is replacement of a previously satisfactory pump. Exact legacy model or visitor-provided working flow/head gives an explicitly labelled reference duty. Free-text names (including "харьковский" or simply "Водолей") never imply an automatic model identification. Unknown models still produce a useful seller brief with known usage and missing information. No separate SEO page per Wilo or other reference model. No fake graph/quality/stock claims for undocumented local alternatives. The seller can continue practical selection from the same brief; local repair, parts and warranty matter.

The alternative "first selection" mode asks purpose, simultaneous points, dynamic water level and distance. Engineering inputs are optional disclosures. Default numbers are examples, not measurements. Bore diameter defaults unknown; 110mm is an editable example, not an assumed universal bore. Need actual internal diameter, cable/fittings clearance and free extraction. Borehole source yield defaults unknown. Existing mains and surface-source scenarios stay separate and linked.

## Data

- data.js: registry of old duties, modern reference/candidate curves, limits, example demands, configurable classes and physics assumptions.
- engine.js: pure matching/calculation, no UI or external calls.
- component.js/css: simple mode controls and seller expand/copy/share/print with restorable URL state. Free-text goes to textContent only.

Legacy Promelectro Vodoley ordinary BCPE 0.5-16/25/32/40/50/63/80/100 U: nominal flow 1.8m³/h =30 L/min; corresponding nominal heads 16/25/32/40/50/63/80/100m. Manufacturer's archived operation manual table 1 (PDF page3):
https://santehsklad96.ru/data/moduleMediaFiles/Catalog/7354/5c2989b6bb971fdf58f758c0459f8689.pdf
This is the manufacturer's original document on a reseller mirror. No data transferred to BCPEU, 3-inch or different capacitor variants. Modern manufacturer context: https://promelectro.com/ru/ . No inference that every Kharkiv pump is this series. Old duty is one nominal point, not a fitted full curve or measurement of the installation. If previous service was unsatisfactory or conditions changed/unknown, no automatic same-duty recommendation.

Aquario curves: exact current HTML data-praph nodes from:
https://aquario.ru/catalog/skvazhinnye-nasosy/asp1e-35-75
https://aquario.ru/node/109 (ASP1E-55-75)
https://aquario.ru/node/111 (ASP1E-75-75)
https://aquario.ru/catalog/skvazhinnye-nasosy/asp1e-100-75
https://aquario.ru/catalog/skvazhinnye-nasosy/asp3e-65-75
ASP1E diameter76mm, minimum bore85mm, submergence1–50m stated in product page. ASP3E body75mm / max submergence50m; minimum bore and minimum submergence are not confirmed in this registry, so remain explicit checks, never inferred from the name. ASP1E35 chart starts at44m while listing max head42m: disclose inconsistency and never use its zero-flow head to set controls or protection.

UNIPUMP ECO tables copied from manufacturer manual, pages5–6, diameter98mm, minimum bore110mm, maximum submerged depth60m:
https://unipump.ru/upload/iblock/4e2/g2xhgnwrls4gv99o0hxkafq651ztc01b/Instruktsiya-UNIPUMP-serii-ESO.pdf
ECO2-34/56/73/89/112 flow nodes [0,17,25,33,42,50,75] L/min; ECO3-40/55 nodes [0,33,42,50,58,67,83,97]. Minimum submergence not numerically confirmed here: verify passport and installation.

Sources checked2026-10-17. No price, availability, guaranteed lifespan, noise rank, equivalence of full curve or control assembly claimed.

## Calculation

For first selection, TDH = dynamic water level below wellhead + consumer elevation above wellhead + required pressure /0.0980665 + friction. Friction length is pump setting depth + outside pipe length; pump setting depth is NOT added again as static head. Assume wellhead at ground reference, smooth plastic pipe, water about20°C. Darcy–Weisbach; laminar64/Re, Haaland turbulent approximation. Local K=4 is a visible example. No aquifer, well drawdown or automatic control simulation.

Candidate head uses interpolation only inside published nodes; check required duty, known diameter, yield and (when setting is known) submergence. Nominal flow ranges, unknown cooling/diameter, high excess head and small head reserve prompt review. Sort candidates by least excess head; this is not a quality score or a guaranteed plug-in replacement. If no candidate, provide specification for seller/owner instead of inventing data. Replacement duty is not reduced or re-augmented with first-selection geometry.

## Verification

Run node podbor-skvazhinnogo-nasosa/test-engine.cjs and JS syntax checks; node scripts/build-static.mjs after shared navigation/search edits. Native JSDOM UI checks covered both modes, exact and unknown names, changed conditions, manual point, safe free text, presets, unknown dimensions, seller expansion/copy/share/print, and URL restore. Existing price calculator presets, add/remove, trip and clear regression-tested. Mobile CSS uses single-column fields at600px, >=48px controls, min-width:0 and the site's fixed-header offset. Real mobile browser visual QA unavailable in this environment; do not claim phone screenshots/tests.

No circulation pump selection; reserve tank sizing and purchase checklists remain later phases.
