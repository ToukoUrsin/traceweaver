# Capture plan — approximately 2:30

Use actual app interactions. No invented incident data, user outcomes or fabricated success states. All timelines are explicitly synthetic. Keep policy, timeline and witness legible; scroll to each area instead of shrinking the full page.

1. **0:00–0:15 / Hook.** Show the deployment story at30seconds: two violations, two fulfilled. “The health check is green. But it belongs to the wrong service. Traceweaver turns promises like ‘every deployment becomes healthy within thirty seconds’ into a tiny language you can execute.”
2. **0:15–0:40 / The language.** Show event schemas and Ready rule. Explain typed fields, target, time unit and correlation. Change `match service` to `match missing`; compile and show located error. Restore it and compile. This proves the implementation is a language, not merely a static chart.
3. **0:40–1:10 / Time.** Rewind; step through0,5,12,18,20,25,30seconds as available. At12, web is fulfilled while API is pending. At18, select Stable/API: trigger+rollback. At30, select Ready/API: closed window and wrong-service look-alike. A later40-second health event does not repair the expired promise.
4. **1:10–1:35 / Transfer.** Switch to Coffee Shop. Inspect order101's wrong drink versus order102's fulfilled espresso. Explain two correlation fields. Switch to Backup to demonstrate Boolean typing and retention, without suggesting real deletions.
5. **1:35–1:55 / Evidence.** Return Deployment, select a violation, jump to resolution. Explain two-event forbidden witness versus absence needing a complete-through window. “This checks the trace you supply. It cannot know whether telemetry is missing.”
6. **1:55–2:15 / Reproducibility.** Export experiment, switch story, import saved file, observe recomputation. Show actual CLI/test terminal only if recorded, never overlay a fake success console.
7. **2:15–2:30 / Payoff.** Return hero/workbench. “A small grammar. Explicit semantics. A replayable explanation. Traceweaver makes ‘not yet’ different from ‘never happened.’” Finish with source URL when actually published.

Narration is a draft, not recorded or listened to. Root owns final edit and public upload. Syntax Summit's published video cap is five minutes.
