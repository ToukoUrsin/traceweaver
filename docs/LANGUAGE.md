# Language reference

## Grammar

```ebnf
policy       = (event | promise)+ ;
event        = "event" name "(" [field ("," field)*] ")" ";" ;
field        = name ":" ("text" | "number" | "bool") ;
promise      = "promise" name "{" "on" name ";" consequence
               "match" name ("," name)* ";" "}" ;
consequence  = "expect" name "within" duration ";"
             | "forbid" name "for" duration ";" ;
trace        = (duration name "(" [argument ("," argument)*] ")" ";")* ;
argument     = name ":" (string | number | "true" | "false") ;
duration     = nonnegative_decimal ("ms" | "s" | "m" | "h") ;
```

Identifiers contain ASCII letters/digits/underscore and begin with a letter/underscore. Whitespace is insignificant; `#` starts a line comment. Strings use double quotes and JSON escapes. Numbers use finite JavaScript IEEE754 semantics; they are not arbitrary-precision decimal measurements. Durations are converted exactly with rational integer arithmetic and must resolve to a whole millisecond. `0.001s` is valid; `0.1ms` is not. Individual durations/timestamps are bounded to10¹²milliseconds. Sources are bounded to100,000characters and25,000tokens, with at most100promises and1,000trace events.

## Static checks

Event names and promise names are unique within their own namespace. Event fields have unique names. Every trigger/target event is declared; forward references are allowed. Every correlation key exists on both schemas with the same type, and cannot appear twice. Every trace event supplies all and only its declared fields with matching types. Timestamps must be nondecreasing. Errors report the source name, line and column. Parsing/type-checking must succeed before any new result is presented.

## Operational semantics

Each observed trigger creates one independent obligation for every rule that names it. A target is eligible when:

1. It appears **after** the trigger in written order.
2. Its timestamp is no later than `trigger time + window`.
3. It has the rule's target event type.
4. Every correlation field equals the trigger's value (no coercion).

The first eligible target resolves the obligation. One target can satisfy/fail multiple overlapping obligations: matching is **broadcast**, not consumption. A trigger never matches itself. An event at the same timestamp can match only if written after the trigger. Zero-length windows therefore permit only later events at that same timestamp.

At replay watermark `now`, all supplied events with time≤`now` are evaluated, including every event at an exact deadline. Only after processing those events does the interpreter conclude absence at a closed deadline.

| Rule | Target observed within window | No target; window open | No target; window closed |
|---|---|---|---|
| `expect … within` | fulfilled | pending | violated |
| `forbid … for` | violated | pending | fulfilled |

Later target events cannot change an expired obligation. Advancing the watermark monotonically only takes an obligation from pending to one final state; replaying backwards recomputes the earlier observation, it does not mutate history.

## Witness meaning

A forbidden-event violation has a **cardinality-minimal two-event witness**: trigger plus first matching forbidden event. Removing either fact eliminates that demonstrated obligation/violation. A missing-target violation has one trigger and a closed-window completeness assertion; the full source trace remains part of the evidence. An isolated event subset cannot independently establish absence. Traceweaver does not claim otherwise.

Wrong-key target events within the visible window are shown as rejected look-alikes with differing fields. These explain correlation; they are not counted as successful matches. Witnesses are minimal explanations for an individual obligation, not global counterexample minimization or formal proofs of unseen system behavior.

## Interchange

`traceweaver/1` JSON contains policy source, trace source, watermark in milliseconds, and optional display label. Import validates both sources and the watermark before changing the UI. Any extra results field is discarded. There is no network connector, storage service, model call or automatic telemetry import.
