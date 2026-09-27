# Working on this report

- Work in this repository. The parent folder contains older standalone HTML and unrelated projects; do not edit them as part of a section request.
- `src/sections/*.html` is the editable source. `dist/` is generated. `legacy/` is archival. Never rerun the migration scripts over editorial changes.
- Preserve the magazine URL and existing section anchors. Honour a request to change only one section; do not redesign the rest of the report incidentally.
- Keep all essential prose and facts in initial HTML. Tab panels are visible without JavaScript. Use native links/disclosures and the shared media controller.
- No autoplay or third-party embedded player at initial load. Use responsive local media, explicit dimensions and lazy loading except the hero image.
- Cite primary sources for factual changes. Reconcile conflicting sources using dated corrections. Future mission dates are targets. `reviewedDate` records fact-checking, not the build time.
- Build and run `pnpm test`. Run the browser workflow for changes to markup, styling or behaviour. Do not call tests passed merely because tests exist.
- Production assets use `src/site.json`'s assetBase. Local preview needs `ASSET_BASE=http://127.0.0.1:4173/`. Never commit a generated localhost installation file as the production deliverable.
- GitHub Pages publishing is automatic on main after checks. Squarespace must have the documented one-time bridge installed. Never claim the magazine page changed without verifying it there.
- Do not add fabricated individual author identities or claim human-only authorship. Match the magazine's British English and photography-led editorial voice.
