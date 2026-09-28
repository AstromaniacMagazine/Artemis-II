# Validation record

Verified on 28 September 2026. Tested application commit: `f61f233`. Production release: `afdf5127a9067f9c`.

- [GitHub Actions run](https://github.com/AstromaniacMagazine/Artemis-II/actions/runs/36408517672): **successful checks and Pages deployment**.
- **7/7 content tests passed**, against both local-test and production builds.
- **33/33 browser tests passed** across desktop Chromium, phone Chromium and phone WebKit. The initial run caught invalid definition-list children; the markup was corrected before deployment. Automated WCAG scans pass; this is not a claim of a complete manual accessibility certification.
- **51/51 external links and media URLs passed** on 27 September; zero failures or unverified URLs. See `reports/links.json`.
- Live NASA liftoff audio and trailer playback were manually confirmed in the preview, with media ready and playback time advancing.
- Public release manifest, CSS, JavaScript and Squarespace installation file returned successfully after deployment. Manifest version matches the local production build.
- Desktop and iPhone screenshots are saved in `reports/desktop-opening.png` and `reports/phone-opening.png`.

- Static build: 14 sections; all initial HTML, anchors, image dimensions, responsive sources and metadata checked.
- Production gzip sizes: 12,793 bytes article HTML, 3,368 bytes CSS, 1,573 bytes JS. These exclude images, fonts and Squarespace platform resources. These are build sizes, not a Lighthouse score or real-user Core Web Vitals.
- Images: 31 distinct original image URLs processed into responsive WebP variants. Original downloads include files larger than 12 MB and 27 MB. No audio, video or YouTube iframe loads at initial render.
- External link report: `reports/links.json`; a nonzero `unverified` count is not a pass.
- Browser tests: CI covers desktop Chromium, phone Chromium, phone WebKit, 320 px, no JavaScript, keyboard operation, native disclosures, audio/video failure states, and successful/failed release updates. GitHub Actions retains traces and screenshots on failures.
- Live Squarespace: **not yet connected or verified**. The available browser session is at the Squarespace login screen. Its platform scripts, advertisements and global styles are outside the isolated build and may affect performance. Re-test on the actual magazine URL after installation.

No claim is made of guaranteed traffic growth, search ranking improvement, or measured live load-time reduction before the updated page is installed and measured.
