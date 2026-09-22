# Validation

Local verification, September21,2026. No hosted CI success or production deployment is claimed.

`npm test`: 18 passing meaningful tests covering inclusive deadlines, no premature absence claims, late events, wrong-key matching, forbidden-window closure, equal timestamp ordering, self-matching exclusion, zero-length windows, overlapping broadcast matches, exact time units and labels, friendly unknown-unit errors, located type/grammar errors, strict values, backwards timestamps, prototype-shaped keys, invalid clocks, empty traces, all fixtures, import validation/recomputation, and actual CLI JSON/exit-code behavior.

Final fixture counts at their complete horizon:

| Fixture | Pending | Fulfilled | Violated |
|---|---:|---:|---:|
| Deployment |0|2|2|
| Coffee shop |0|1|1|
| Backup/restore |0|2|2|

The campaign owner verified these actual integrated-browser flows at 1280×720: Deployment at 30 seconds gives two violated/two fulfilled; Coffee at 120 seconds gives one violated/one fulfilled; rewinding to zero gives one pending; changing Coffee's window to three minutes and advancing to 190 seconds yields two fulfilled, with the actual E05 match at 150 seconds. Invalid `2kg` policy source removes stale results and reports the source location. That unit diagnostic was then improved to name the unknown unit and list the supported units, covered by a new test. The owner reports a polished, readable layout at that viewport.

The building agent's integrated-browser binding was unavailable. Browser export/import, Backup interaction and narrow mobile layout remain unverified; these are not claimed complete from unit tests. The local server remains at http://127.0.0.1:8781. Import validation itself is tested at the module boundary.

All examples are synthetic and authored for this project. Missing telemetry is a known semantic limit, not a tested real-world absence signal. Performance is bounded by source/event/rule caps, but broad load or browser compatibility testing has not been performed.
