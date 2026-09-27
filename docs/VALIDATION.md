# Validation record

This file is updated with actual results before delivery. A test being present is not evidence that it ran.

- Static build: 14 sections; all initial HTML, anchors, image dimensions, responsive sources and metadata checked.
- Initial compressed build: approximately 12.7 KB article HTML, 3.3 KB CSS, 1.6 KB JS. These are build sizes, not a Lighthouse score or real-user Core Web Vitals.
- Images: 31 distinct original image URLs processed into responsive WebP variants. Original downloads include files larger than 12 MB and 27 MB. No audio, video or YouTube iframe loads at initial render.
- External link report: `reports/links.json`; a nonzero `unverified` count is not a pass.
- Browser tests: CI covers desktop Chromium, phone Chromium, phone WebKit, 320 px, no JavaScript, keyboard operation, native disclosures, audio/video failure states, and successful/failed release updates. GitHub Actions retains traces and screenshots on failures.
- Live Squarespace: not yet connected or verified. Its platform scripts, advertisements and global styles are outside the isolated build and may affect performance. Re-test on the actual magazine URL after installation.

No claim is made of guaranteed traffic growth, search ranking improvement, or measured live load-time reduction before the updated page is installed and measured.
