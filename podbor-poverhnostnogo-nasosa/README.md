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

## Task-first revision, 2026-10-17

Owner clarified local use: boreholes for irrigation are common even where central water supplies the house; new homes may use a borehole for domestic water; wells are rare. The first screen therefore routes irrigation/yard, house-from-source and mains pressure boosting separately. A choice of irrigation demand and simultaneous lines sets editable example flow and end pressure. Plot area alone does not determine simultaneous delivery. Schemes and engineering figures were removed from the main decision flow; pipe details remain in an optional disclosure. Results include four conditional flow categories, a selected hydraulic example, and a copy/share/print shopping brief. URL state restores the calculation.

Reference categories (editorial examples, not an industry standard or quality rating): AJC-60C, AJC-81, AJC-125C, AJC-200. AJC-125C and 200 exact data-praph points were retrieved from their respective manufacturer pages. No slope continuation beyond the last published node. AJC-125C source mass is 16.9 kg. Lift maxima reflect the stated limitations; all near-limit suction remains review-only.

Alternative candidate registry is separate and evaluated for the user's requested duty, not a hard-coded brand-equivalence table. At zero minimum margin, a candidate must have published head at the requested flow >= calculated requirement, lift within its limit, and source yield not known to be insufficient. It is only a hydraulic candidate, not guaranteed equivalence of control, noise, lifespan, fittings or full curve. No claim of being cheaper without a local quote or local availability. Every viable reference card has this common candidate mechanism. No invented alternative when the registry cannot support the duty.

UNIPUMP JET 60 S / 80 S / 100 S / 110 L: current manufacturer's combined manual, page 4; numerical flow rows 0,10,...L/min; unavailable cells excluded. The current JET60S table is 33m at zero flow (not older 30m tables). Source:
https://unipump.ru/upload/iblock/450/lkfyvsb1fgzwzxs30r7a1fgfqay8rtv5/Instruktsiya-seriya-JET-L.pdf

LEO AJm110L / AJm150L: exact numerical table at 0,10,15,20,25,30,35,40,45,50,60,70,80,100,120,140 L/min. European catalogue execution; local version and supply must be checked, and no price is asserted:
https://www.leopumps-europe.com/en/pump/AJm%20(%3E1%20kW).html

Native DOM tests additionally cover all three purpose routes, unit count/preset updates, candidates in the selected reference card, unknown/deep water, invalid fields, shopping brief and full URL restoration. Circulation selection remains excluded. Submersible pump modelling remains a later phase, not silently simulated by this surface tool.
