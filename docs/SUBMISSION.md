# Syntax Summit submission draft

Status: not submitted. Public source https://github.com/ToukoUrsin/traceweaver and live app https://toukoursin.github.io/traceweaver/ exist. Demo video `media/traceweaver-demo.mp4` (2:40) is recorded but not uploaded; insert the YouTube URL only after upload. Upload copy: `media/YOUTUBE.md`. Gallery screenshots: `media/traceweaver-*.png`.

**Name:** Traceweaver

**Tagline:** A tiny temporal language that makes event-stream promises executable, replayable and explainable.

**Inspiration:** Teams say “the deployment should become healthy in thirty seconds” or “this backup must survive ten minutes.” Those statements hide correlation, ordering and missing-data assumptions. Traceweaver gives those assumptions a small, explicit grammar.

**What it does:** Declare typed events, write expected/forbidden-event rules, and run them over an editable trace. Each observed trigger produces an independent pending, fulfilled or violated obligation. Replay time, inspect mismatched correlation keys, and see a minimal violation explanation. A repository CLI uses the same evaluator. Exported experiments preserve source and observation time; imports recompute rather than trusting stored results.

**How it was built:** Original dependency-free JavaScript ES modules implement tokenization, parsing, schema/type checking, exact millisecond duration conversion and deterministic finite-trace evaluation. A CSS/SVG workbench renders the interpreter's actual output. Tests cover deadline boundaries, same-timestamp ordering, zero windows, overlapping obligations, strict schemas, wrong-key events, invalid imports and all fixtures.

**What makes it a language:** Explicit grammar, typed event declarations, correlation constraints, source-located compile diagnostics, operational semantics, executable programs, and a standalone interpreter. It is not a wrapper around an existing monitoring service or model.

**Technical challenge:** Absence is only meaningful after a complete observation window closes. Targets at the exact deadline must be processed before failure is concluded. A missing-event explanation cannot pretend an isolated event subset proves absence. Those choices are documented and tested.

**Limits:** Synthetic examples only; no production validation, external telemetry feed or inference API. Completeness applies to the supplied trace, not unseen reality. Matching is broadcast, not event consumption. This is finite-trace checking, not a general proof assistant.

**AI disclosure:** OpenAI Codex substantially assisted design, implementation, tests and documentation. Claude Code assisted browser QA fixes and produced the demo video, narrated by an ElevenLabs stock synthetic voice over real app footage. Runtime uses no AI models. No private campaign code, YC code, real customer logs or third-party datasets were copied. Fixtures, grammar, UI and implementation were created for this project during September21,2026.

**Rights:** MIT license. System fonts and original CSS/SVG; no third-party runtime dependencies.

**Official requirements checked:** [Overview](https://syntax-summit.devpost.com/) and [rules](https://syntax-summit.devpost.com/rules), September21. Global student/age eligibility must be truthfully affirmed by entrant. Solo allowed; original work during current window; repository and ≤5-minute working demo required. Deadline January14,2027 17:00PKT /04:00PST. Six noncash awards; no cash amount claimed. No explicit AI restriction found; disclosure provided. No submission receipt exists yet.
