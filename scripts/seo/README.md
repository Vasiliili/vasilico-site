# Publishing and future AI-assisted editing

The existing GitHub repository remains the only editing/publishing authority. No administrative HTTP API or new server is needed. GitHub authentication stays in the connector or GitHub Actions; never put tokens in browser files.

## Editing

- Articles using the existing renderer: add/edit `knowledge.js`. The build creates a missing article's HTML from the retained site skeleton, renders it with existing components, and includes it in the advice index, sitemap, Markdown, llms.txt and JSON catalogue.
- Standalone pages: retain a real `index.html` with meaningful HTML, a single H1, and normal links. New pages must have an incoming link from an existing public page. `scripts/seo/check.mjs` verifies links and metadata; the catalogue is not a substitute for visitor navigation.
- Current prices: only `pricing-data.js`; historical case receipts stay historical.
- Photos: existing `photos/` directories, descriptive alt attributes, no private client data.
- Drafts: do not create an indexable HTML route until the owner approves publication. Use a feature branch/PR. Run the checks and show the diff, then publish with the owner's confirmation. Do not silently promote drafts.

## Commands

```
npm ci --ignore-scripts
npm run build
npm run check
npm test
node scripts/seo/stage.mjs
```

`node scripts/build-static.mjs` remains the compatible single build entry point. There are no new browser dependencies. jsdom is a development-only test dependency.

The generation is idempotent. `content-state.json` records a normalized content fingerprint and the actual build date of a meaningful HTML/metadata change. Cache query hashes alone do not update lastmod. Keep this manifest across commits. Do not replace it with a fresh timestamp on every build. Existing explicit publication dates are preserved. Unknown original publication dates are not invented.

Deleted HTML is excluded on the next build. Also remove its incoming links and its `knowledge.js` record if applicable; otherwise the article will intentionally be regenerated from that source. Old generated Markdown not associated with any indexed HTML must be removed by the build. Keep historical git versions for rollback.

## GitHub Pages one-time setting

The current site uses branch-based Pages publishing. Select **repository Settings → Pages → Build and deployment → Source → GitHub Actions** once to enable deployment only after passing all checks. The workflow detects the current mode: while still in legacy mode it runs checks and prepares the artifact but preserves the existing deployment. It cannot make branch-based publication wait for an unrelated workflow. This is an explicit remaining setup step, not a claim that a mandatory gate already exists.

`site-quality.yml` builds, tests, stages only public assets, and deploys the checked artifact when Actions publishing is selected. `site-after-publish.yml` verifies actual public URLs and sends IndexNow notifications only after successful deployment and live checks. Reports are private workflow artifacts (subject to repository artifact access), not site pages. In legacy mode source tooling is still retrievable because the repository root is deployed; it contains no secrets. In Actions mode SQL/tooling/tests/reports are excluded from the deployed artifact.

IndexNow uses a **public proof-of-ownership file**, not an administrative secret. The key grants no edit ability. The notifier submits changed/removed canonical URLs, records HTTP responses, treats 202 as key verification pending, and never promises indexing. Google is notified via the normal sitemap/Search Console path, not the restricted Indexing API.

## Crawlers / Cloudflare

The wildcard training policy was public `Allow: /` before this change. It remains public for GPTBot and ClaudeBot; no new training decision was made. Explicit future GPTBot/ClaudeBot/Google-Extended groups are preserved. Named search/user agents receive the same technical exclusions as the wildcard. robots.txt is advisory, not access control: private statistics are protected by their existing server-side token check, receipts remain noindex.

Current public responses show GitHub Pages/Fastly headers and no Cloudflare challenge. This is not an account-level WAF/IP verification. If Cloudflare proxy is enabled later, examine Security Events, AI Crawl Control, WAF/Bot rules and verified-bot identity. Never allow a bot based only on its claimed User-Agent and never disable all protections. Use official published IP lists/reverse DNS where applicable.

Sources checked 2026-10-28:
- https://developers.openai.com/api/docs/bots
- https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- https://developers.cloudflare.com/bots/concepts/bot/verified-bots/
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://www.indexnow.org/documentation
- https://llmstxt.org/

llms.txt/Markdown/JSON are supplemental access methods. They are generated from the same real HTML, not separate editorial copies. No special AI indexing/citation guarantee exists.

The CI build also reads the last public catalogue's content fingerprints before generating new files. This preserves lastmod even when a source edit did not commit generated files. Its technical-checks artifact retains the pending changed/deleted URL list and prior public catalogue. The post-publication workflow downloads that artifact, checks each page's exact `site-content-hash` rather than merely HTTP 200, and only then uses the retained URL list for IndexNow. Legacy publishing is still not blocked by failed checks until the one-time Pages setting is changed.
