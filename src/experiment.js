import {compile, parseTrace, timelineEnd} from './engine.js';
export function readExperiment(text) {
  if (typeof text !== 'string' || text.length > 250000) throw new Error('Experiment exceeds 250 KB.');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Expected valid JSON.'); }
  if (!data || data.format !== 'traceweaver/1' || typeof data.policy !== 'string' || typeof data.trace !== 'string') throw new Error('Expected a traceweaver/1 experiment with policy and trace source.');
  const program = compile(data.policy), events = parseTrace(data.trace, program);
  if (!Number.isSafeInteger(data.watermark) || data.watermark < 0 || data.watermark > timelineEnd(program, events)) throw new Error('Watermark must be within the experiment timeline.');
  return {format:'traceweaver/1', policy:data.policy, trace:data.trace, watermark:data.watermark, label:typeof data.label === 'string' ? data.label.slice(0, 150) : 'Imported experiment'};
}
