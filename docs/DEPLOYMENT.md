# GitHub and Squarespace publishing

## What runs automatically

Pushes to `main` → build and content checks → Chromium/WebKit browser tests → production build → GitHub Pages deployment. The public release manifest points to content-hashed HTML, CSS and JavaScript. Pictures are pre-generated and committed; no image processing occurs in the reader's browser.

The provided `embed.js` checks the current release when the Squarespace page loads. It validates asset origins, fetches the complete release, loads CSS and JavaScript, then replaces the installed report. A failed fetch retains the installed, fully readable report and its controls. There is no iframe, scraping service, credential in the page or recurring browser automation.

## One-time Squarespace connection

1. Confirm the GitHub Pages deployment is successful and review the desktop and phone layouts at the preview URL.
2. Keep a Squarespace page duplicate as a recovery copy before replacing its code. Do not change the existing public slug.
3. On the existing report page, replace the old report code blocks with **one** code block containing the generated `squarespace.html`. Remove the old report scripts and floating navigation from that page, otherwise both implementations would run. Keep the magazine's global header/footer settings as appropriate.
4. Set the block's section to full width and remove section padding. Do not put the long report in a fixed-height Fluid Engine grid row. Verify the section expands to the report's height on mobile and desktop. Classic editor or an auto-height section is preferable for this block.
5. Set the page SEO title and description to the values in `src/site.json`. Squarespace should retain its canonical URL. The block contains Article structured data; do not add a duplicate Article schema manually.
6. Save and test the public page while logged out. Squarespace's editor may intentionally disable embedded scripts. Confirm only one `#am-artemis` article is present and its `data-version` matches `release.json`.

Download the current installation file from [GitHub Pages](https://astromaniacmagazine.github.io/Artemis-II/squarespace.html) or the latest Actions build artifact. Open it as source; it is a generated code block, not a separate destination for readers.

## SEO: a real limitation, not a hidden promise

Squarespace has no supported general-purpose Pages content publishing API used by this repository. GitHub Actions cannot natively rewrite a Squarespace code block. This installation therefore supplies full initial HTML and applies later updates in the browser. Google can render JavaScript, but rendering may be delayed, and some other crawlers do not run it. Social preview metadata is still served by Squarespace.

Refresh the installed `squarespace.html` snapshot and Squarespace metadata after substantial editorial changes. For completely automatic updates to **raw server-delivered HTML at the existing magazine URL**, a separately authorised host/edge routing integration is needed. This repository does not silently alter DNS or routing for the magazine. Its generated `index.html` is already static and can support such an integration; remove its preview-only `noindex` in that deployment.

Reference: [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Timing and rollback

New visits pick up a deployed release; open tabs are not forcibly refreshed. The release request uses a minute-based cache key, but GitHub CDN propagation and the build duration still mean updates are not instantaneous. Content hashes keep related files consistent.

Revert the relevant commit on `main` and let the same tests/deployment run to roll back. Do not rewrite branch history. If the external connection must be removed, delete only the `data-am-embed` script from the installed block: the complete installed HTML/CSS and fallback controls remain usable. If old installed snapshots refer to removed images, restore those images from Git history as well. Existing images should normally remain in `public/media` for fallback compatibility.

## Repository access

Only a trusted publisher should have write access to `main`: its code runs in the magazine page after installation. The workflow requests read access for checks and only Pages/OIDC publishing permissions in the deployment job. No Squarespace credentials are stored in GitHub.
