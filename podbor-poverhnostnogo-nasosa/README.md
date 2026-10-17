# Surface self-priming pump selection — phase 1

Standalone static tool at /podbor-poverhnostnogo-nasosa/. No build dependencies.

- data.js: separate model registry, manufacturer H(Q) nodes, date-stamped RRP and assumptions.
- engine.js: pure duty-point head screening, Darcy–Weisbach pipe loss with laminar friction / Haaland approximation for smooth plastic at 20°C. Local loss coefficients are visible, editable assumptions. Transition flow uses the turbulent approximation; this remains an approximate screen.
- component.js / component.css: UI and responsive styling. All conditions remain equal between models. No implied pressure control.

Sources checked 2026-10-17:
https://aquario.ru/catalog/poverhnostnye-nasosy/ajc-60s
https://aquario.ru/catalog/poverhnostnye-nasosy/ajc-81
https://aquario.ru/catalog/poverhnostnye-nasosy/ajc-101

Curves are exact semicolon-separated data-praph nodes from each manufacturer's chart. AJC-60C maximum flow listing is 45 L/min but its chart stops at 40: do not extrapolate. AJC-81/101 list Hs=7m in the summary and up to 8m manometric suction in limitations; do not imply a guaranteed 8m operating installation. Flag suction lift + suction loss >=5m for review (configurable conservative attention threshold, not NPSHr). No NPSH curve or installation guarantee. Declared power P1 is not continuous measured consumption. RRP is not local inventory or a shop quote. Noise, lifespan and installation dimensions not verified: state unknown, no quality score fabricated.

Unknown dynamic water level prevents a model recommendation. Unknown source yield allows head comparison with an explicit pending source check. Pressure shown is the remaining head converted at the requested flow, not a solved tap operating point. Pipe friction, elevation, local loss and pressure balance are independently testable. No extrapolation beyond manufacturer curve; no dry-run, controller, transient or cavitation simulation.

Checks:
node podbor-poverhnostnogo-nasosa/test-engine.cjs
node --check podbor-poverhnostnogo-nasosa/component.js
node scripts/build-static.mjs

Native JSDOM UI checks cover input changes, unknown/blank fields, presets, source changes, site search and regression checks of existing pricing presets, add/remove, trip and clear. CSS reviewed for one-column mobile controls, min-width:0, 48px inputs, inherited fixed header offset. Real mobile browser visual QA unavailable in this environment; owner phone review remains useful.

Approved next phases: separate borehole/submersible selector (actual internal bore; 110mm option), reserve water tank sizing, purchase/photo/measurement checklists. Circulation pump selection explicitly excluded by owner. Never merge source-pumping with the existing central-water pressure booster tool or treat brand/price as verified durability.
