# Validation

Local verification, September21,2026. No hosted CI success is claimed. The static app is hosted on GitHub Pages at https://toukoursin.github.io/traceweaver/.

`npm test`: 18 passing meaningful tests covering inclusive deadlines, no premature absence claims, late events, wrong-key matching, forbidden-window closure, equal timestamp ordering, self-matching exclusion, zero-length windows, overlapping broadcast matches, exact time units and labels, friendly unknown-unit errors, located type/grammar errors, strict values, backwards timestamps, prototype-shaped keys, invalid clocks, empty traces, all fixtures, import validation/recomputation, and actual CLI JSON/exit-code behavior.

Final fixture counts at their complete horizon:

| Fixture | Pending | Fulfilled | Violated |
|---|---:|---:|---:|
| Deployment |0|2|2|
| Coffee shop |0|1|1|
| Backup/restore |0|2|2|

The campaign owner verified these actual integrated-browser flows at 1280×720: Deployment at 30 seconds gives two violated/two fulfilled; Coffee at 120 seconds gives one violated/one fulfilled; rewinding to zero gives one pending; changing Coffee's window to three minutes and advancing to 190 seconds yields two fulfilled, with the actual E05 match at 150 seconds. Invalid `2kg` policy source removes stale results and reports the source location. That unit diagnostic was then improved to name the unknown unit and list the supported units, covered by a new test. The owner reports a polished, readable layout at that viewport.

## Browser QA, September 22, 2026

Headless Chromium (Playwright) against the local server at 1440×1000 and 390×844, with no console errors, page errors or failed requests at either size:

- Deployment at 30 seconds: 2 violated, 2 fulfilled. Rewind gives 2 pending; stepping visits 5, 12, 18, 20, 25, 30, 35 and 40 seconds with the documented counts.
- Selecting each obligation, Jump to resolution, Play/Pause and all three stories (Coffee at 2 minutes: 1 violated, 1 fulfilled; Backup at 5 minutes: 2 violated, 1 pending, 1 fulfilled).
- Error recovery: `30kg` reports `policy:8:25 Unknown time unit kg. Use ms, s, m, or h.` and hides stale results; `match missing` reports `policy:9:9`; a valid edit compiles and results return.
- Export downloads `traceweaver-experiment.json`; importing it after switching stories restores source and watermark and recomputes. A malformed import is rejected with a located message and leaves the current story untouched.
- No horizontal page scroll at 390px; the timeline scrolls inside its own container.

Fixes from this pass: singular compile counts ("1 typed promise"), source locations in import errors, the footer links to the rendered language reference instead of raw Markdown, and the narrow-screen header no longer crowds the brand.

The demo video `media/traceweaver-demo.mp4` (2:40) is a Playwright recording of the actual UI plus real `node src/cli.js` and `npm test` output captured at recording time. Not verified: other browsers (Firefox, Safari), real touch devices, screen readers, and the hosted Pages build beyond loading its home page.

All examples are synthetic and authored for this project. Missing telemetry is a known semantic limit, not a tested real-world absence signal. Performance is bounded by source/event/rule caps, but broad load or browser compatibility testing has not been performed.
