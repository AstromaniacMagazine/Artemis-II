# Artemis II · Astromaniac Magazine

The editable source for [Artemis II Mission Report](https://www.astromaniacmagazine.com/artemis-ii-mission-report). Built as static HTML with small, optional JavaScript enhancements. The existing section anchors, NASA photography, recordings and shop links are retained.

## Edit a section

Change only its file in `src/sections/`. For example, “edit the crew section only” means `src/sections/crew.html`. Shared verified figures, dates, source URLs and metadata live in `src/site.json`. Styling is in `src/report.css`; interactions are in `src/report.js`.

| Section | File |
| --- | --- |
| Opening and navigation | `hero.html` |
| Mission facts | `essentials.html` |
| Launch and lunar photography | `launch.html` |
| Astronauts | `crew.html` |
| NASA trailer | `trailer.html` |
| Leadership | `key-players.html` |
| International partners and Accords | `partners.html` |
| Orion | `orion.html` |
| Flight path | `flyby.html` |
| Science and human moments | `highlights.html` |
| Return and recovery | `splashdown.html` |
| Artemis I–V | `timeline.html` |
| Store artwork | `posters.html` |
| References and closing links | `sources.html` |

## Build and check

Use Node 22 or newer and pnpm 10.17.1.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
pnpm check:links
```

For a local preview, build with `ASSET_BASE=http://127.0.0.1:4173/`, then run `pnpm dev`. In PowerShell:

```powershell
$env:ASSET_BASE='http://127.0.0.1:4173/'
pnpm build
pnpm dev
```

Unset `ASSET_BASE` before building production. Google Drive requires plain dependency directories; `.npmrc` configures pnpm accordingly.

For browser tests: `pnpm exec playwright install chromium webkit`, then `pnpm test:browser` against a local build. CI tests desktop Chromium, Android-sized Chromium and iPhone-sized WebKit, including 320 px, keyboard navigation, no JavaScript, accessibility and release failure handling.

## Publishing

Every push to `main` runs checks and builds before deploying to GitHub Pages. Pull requests run checks without deploying. A failed check leaves the previous deployed release in place. GitHub's weekly link workflow checks external pages and media; its report distinguishes failures from URLs it could not verify.

The [Pages edition](https://astromaniacmagazine.github.io/Artemis-II/) is a preview and asset host, with `noindex` and a canonical URL pointing to the magazine. It does not replace the magazine domain by itself.

**One Squarespace installation is required.** See [deployment instructions](docs/DEPLOYMENT.md) for the connection, SEO limitations, update behaviour and rollback. After installation, visitors receive new content and assets on subsequent page loads following a successful GitHub deployment. The raw Squarespace HTML fallback remains the installed snapshot until it is refreshed.

## Images and evidence

`public/media/` contains optimised WebP variants. `src/media.json` maps each to the original source and records sizes. To add a photograph, add its original URL to a section and run `node scripts/optimise-images.mjs`. Check credits and content, then commit the image variants and manifest. Builds fail if a referenced image has not been optimised.

`legacy/` preserves the original live section code for comparison; it is never included in the published build. The migration scripts are historical utilities, not part of the build, and must not be rerun over edited sections.

See [fact checks](docs/FACT-CHECK.md) and [test notes](docs/VALIDATION.md). No analytics tracker or claim of guaranteed traffic growth is added. Search performance should be evaluated in the magazine's Search Console after deployment.
