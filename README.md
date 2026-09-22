# Traceweaver

An original, executable temporal language for promises in event streams. Write typed events and a rule, replay a trace, and inspect why an obligation is **pending**, **fulfilled**, or **violated**.

Traceweaver includes a lexer, parser, schema/correlation type checker, deterministic finite-trace interpreter, browser workbench, and command-line evaluator. It requires no account, inference API, package installation or build step. All three sample traces are authored synthetic fixtures. No production reliability or field impact is claimed.

## Run

Requires Python3 for the local static server. Node20+ is only needed for tests and CLI.

```sh
python3 -m http.server 8781 --bind 127.0.0.1
```

Open **http://127.0.0.1:8781**. Use a local HTTP server, because browser ES modules generally cannot load through `file://`.

```sh
npm test
node src/cli.js examples/deploy.weave examples/deploy.trace --at 30000
```

The CLI outputs JSON and returns0 when no observed obligation violates,1 for violations,2 for invalid input. A0 exit can include pending obligations or no triggers; inspect counts before treating it as success.

## Try it

1. Open Deployment: at30seconds, two promises violate and two hold.
2. Rewind. API readiness is **pending**, not falsely failed. Step to12seconds: the web service is healthy, but API is still waiting.
3. At18seconds, inspect Stable/API: a trigger and rollback form a two-event witness.
4. At30seconds, inspect Ready/API: the window closed without a matching check. E03 is rejected because it belongs to `web`.
5. Coffee Shop matches both order number and drink. The wrong drink cannot satisfy the correct order.
6. Change a correlation field or schema type; compile to see a located diagnostic. Invalid/edited sources hide old results.
7. Export sources and watermark, switch stories, then import the JSON. Results are recomputed from validated source. There is no autosave; export before closing or refreshing.

## Language sample

```text
event Deploy(service: text, version: text);
event Healthy(service: text);

promise Ready {
  on Deploy;
  expect Healthy within 30s;
  match service;
}
```

```text
0s Deploy(service: "api", version: "v42");
12s Healthy(service: "web");
40s Healthy(service: "api");
```

This promise is pending until30seconds, then violated. The40-second check never repairs the expired30-second obligation. [Full language semantics](docs/LANGUAGE.md).

## Architecture and limits

- `src/engine.js`: source-located tokens → AST/event schemas → type validation → finite-trace obligations and evidence.
- `src/experiment.js`: bounded, transactional experiment import; stored evaluation claims are ignored.
- `src/app.js`: browser rendering and replay controls, with DOM text escaped before HTML insertion.
- `src/cli.js`: same interpreter exposed without a browser.
- `examples/`: three inspectable `.weave` policies and `.trace` fixtures.
- `tests/`: boundary, matching, parsing, chronology and import checks.

The watermark asserts completeness only for **the supplied trace**. Missing telemetry cannot be distinguished from an event that never happened. Rules match future events in written order, with an inclusive deadline and broadcast matching across overlapping obligations. This is a bounded trace-checker, not a distributed streaming service, general temporal logic model checker, or proof assistant. No telemetry is collected. Documents and source remain local unless you export/share them. See [validation](docs/VALIDATION.md).

## Provenance

Created from scratch on September21,2026 for Syntax Summit. No code copied from Counterseed, GIBC, YC projects, or other campaign repositories. The temporal grammar, interpreter, fixtures, UI and tests are original. Development used OpenAI Codex extensively for design, implementation, tests and documentation, and Claude Code for browser QA fixes and the demo video; it should not be described as unaided human-written code. Runtime performs no AI inference. System fonts and CSS/SVG visuals require no remote assets. MIT licensed; no third-party runtime dependencies.

Syntax Summit's public rules permit original work during its July18,2026–January14,2027 window and require a repository plus working demonstration up to five minutes. Eligibility and final form remain the entrant's responsibility. [Submission draft](docs/SUBMISSION.md) · [demo video](media/traceweaver-demo.mp4) · [how it was filmed](docs/DEMO.md).
