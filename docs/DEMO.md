# Demo video

`media/traceweaver-demo.mp4`: 2:40, 1920×1080 H.264/AAC, English captions in `media/traceweaver-demo.en.srt`. Recorded September 22, 2026. Not yet uploaded; upload copy is in `media/YOUTUBE.md`.

## How it was made

- Footage is a single Playwright (headless Chromium) screen recording of the actual app at a 1600×900 viewport, served locally from this repository, scaled to 1080p. Every click, keystroke, download and file import happens in the real UI; pacing comes from holding real frames. A small dot shows where the automated mouse is.
- The CLI/test scene shows real `node src/cli.js examples/deploy.weave examples/deploy.trace --at 30000` (exit code 1) and `npm test` (18 passing) output captured just before recording, with the CLI JSON truncated after 26 lines and marked as such.
- The last scene loads the rendered language reference on GitHub and the live GitHub Pages app.
- Narration is an ElevenLabs stock synthetic voice reading a script written for this video. Example traces are synthetic.

## Scenes

| Time | Scene | What happens on screen |
|---|---|---|
| 0:00 | The problem | Hero, the Deployment policy and trace, its 2 violated / 2 fulfilled results |
| 0:25 | Writing a program | Policy cleared and a `Ready` promise typed from scratch, then compiled: 3 event types, 1 typed promise, 5 events |
| 0:51 | Running it | Rewind to 0 (pending), step to 12s (web fulfilled, API pending), 30s (API violated), witness with the rejected `web` look-alike, then 40s: the late health check does not repair it |
| 1:25 | Error recovery | `30s` edited to `30sec`: `policy:7:25 Unknown time unit sec. Use ms, s, m, or h.`, results hidden; fixed and recompiled |
| 1:46 | Export and reimport | Export, switch to Coffee shop, import the saved file through the file chooser, results recomputed at 40s |
| 2:03 | CLI and tests | Real captured terminal output |
| 2:25 | Close | Rendered language reference, live app |
