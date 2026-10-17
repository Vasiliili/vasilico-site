# Storage water heater sizing tool

Published path: `/podbor-vodonagrevatelya/`. Static, dependency-free browser code.
Existing GitHub Pages hosting and site style are preserved.

- `data.js`: volume choices, reference flow examples, defaults, 1.163 Wh/(L K)
  heat capacity approximation and 20% recommendation reserve factor.
- `engine.js`: pure thermal model, validation, sequential scenario and volume recommendations.
- `component.js`: controls, measurement helper, results, icons and reset.
- `component.css`: responsive component styles, existing site's palette.

Assumptions: fully heated initial tank, ideal stratified usable energy relative to
incoming cold water, one common mixed temperature, no distribution/standing loss.
Sequence: individual showers (user-selected pauses), bath, basin, kitchen. This is
not a time-dependent stratification simulation or a product-certified V40.
Heating credit during draw is opt-in and explicitly optimistic; between-shower
pauses always credit the selected heating power, up to the tank's full energy.
When demand exceeds available energy, only the served portion counts as useful
hot water; unmet ongoing draw consumes any incoming heat without storing it.
No automatic wait is inserted. A higher tank volume never claims a pressure benefit.

Recovery and initial heating time use E/P and omit control delays and losses.
Recommendation picks the smallest listed volume that satisfies the schedule in
this ideal model; reserve is the next listed volume >= 1.2 times that minimum.
It is not a guarantee for real equipment. No fabricated models, V40 figures,
quality ratings or retailer prices are included. New verified product datasets
can be added later without replacing the calculation component.

References linked in-page: Ariston product table illustrating V40, CDC home water
heater hygiene and thermostatic anti-scald guidance. The separate published
advice article preserves the master's reported cleaning/temperature experience,
without diagnosing Legionella from smell or recommending universal 70 °C.

Validation: `node podbor-vodonagrevatelya/test-engine.cjs` verifies heat balance,
mixing, power-independent initial capacity, recovery time, pauses, monotonic
volume behaviour, invalid input and scenario recommendations across 264 variants.
A LinkeDOM harness checked event-driven controls, fixture toggles, measurements,
invalid temperatures, presets, heating toggle and reset. Site search, source
syntax, canonical URL, one h1 and sitemap were checked separately. Browser QA
was unavailable in this managed environment, so mobile layout was not visually
verified on a physical browser; responsive rules and inherited header spacing
were inspected in source. No preview server or browser was installed.
