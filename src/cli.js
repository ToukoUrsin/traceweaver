import {readFileSync} from 'node:fs';
import {compile, parseTrace, evaluate, timelineEnd} from './engine.js';
const [policyFile, traceFile, option, at] = process.argv.slice(2);
if (!policyFile || !traceFile || (option && option !== '--at')) {
  console.error('Usage: node src/cli.js policy.weave events.trace [--at MILLISECONDS]'); process.exit(2);
}
try {
  const program = compile(readFileSync(policyFile, 'utf8'));
  const events = parseTrace(readFileSync(traceFile, 'utf8'), program);
  const state = evaluate(program, events, option ? Number(at) : timelineEnd(program, events));
  console.log(JSON.stringify({watermark:state.now, counts:state.counts, obligations:state.results.map(r=>({promise:r.rule.name, trigger:r.trigger.id, deadline:r.deadline, status:r.status, matched:r.matched?.id??null, witness:r.witness, rejected:r.rejected.map(x=>({event:x.event.id,fields:x.fields}))}))},null,2));
  process.exitCode = state.counts.violated ? 1 : 0;
} catch (e) { console.error(`${e.source??'input'}:${e.line??1}:${e.column??1}: ${e.message}`); process.exitCode = 2; }
