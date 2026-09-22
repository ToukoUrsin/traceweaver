/** Traceweaver: an original typed temporal language and finite-trace interpreter. */
export class Diagnostic extends Error {
  constructor(message, token = {}, source = 'policy') {
    super(message); this.name = 'Diagnostic'; this.line = token.line ?? 1;
    this.column = token.column ?? 1; this.source = source;
  }
}

export function lex(source, name = 'policy') {
  if (source.length > 100000) throw new Diagnostic('Source exceeds 100,000 characters.', {}, name);
  const tokens = []; let i = 0, line = 1, column = 1;
  const advance = text => { for (const c of text) { if (c === '\n') { line++; column = 1; } else column++; } i += text.length; };
  while (i < source.length) {
    const tail = source.slice(i);
    const space = /^(?:\s+|#[^\n]*)/.exec(tail);
    if (space) { advance(space[0]); continue; }
    const at = {line, column}; let kind, value, raw;
    if (tail[0] === '"') {
      raw = /^"(?:[^"\\\n]|\\.)*"/.exec(tail)?.[0];
      if (!raw) throw new Diagnostic('Unterminated string. Use double quotes and JSON escapes.', at, name);
      try { value = JSON.parse(raw); } catch { throw new Diagnostic('Invalid string escape.', at, name); }
      kind = 'string';
    } else if ((raw = /^\d+(?:\.\d+)?[A-Za-z]+\b/.exec(tail)?.[0])) {
      const unit = /[A-Za-z]+$/.exec(raw)[0];
      if (!['ms', 's', 'm', 'h'].includes(unit)) throw new Diagnostic(`Unknown time unit ${unit}. Use ms, s, m, or h.`, at, name);
      kind = 'duration'; value = duration(raw, at, name);
    } else if ((raw = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/.exec(tail)?.[0])) {
      kind = 'number'; value = Number(raw);
      if (!Number.isFinite(value)) throw new Diagnostic('Numbers must be finite.', at, name);
    } else if ((raw = /^[A-Za-z_][A-Za-z_0-9]*/.exec(tail)?.[0])) {
      kind = 'id'; value = raw;
    } else if ('{}():,;'.includes(tail[0])) { raw = tail[0]; kind = raw; value = raw; }
    else throw new Diagnostic(`Unexpected character ${JSON.stringify(tail[0])}.`, at, name);
    tokens.push({kind, value, raw, ...at}); advance(raw);
    if (tokens.length > 25000) throw new Diagnostic('Too many tokens.', at, name);
  }
  tokens.push({kind: 'eof', value: '', line, column}); return tokens;
}

function duration(raw, at, name) {
  const [, value, unit] = /^(\d+(?:\.\d+)?)(ms|s|m|h)$/.exec(raw);
  const [whole, fraction = ''] = value.split('.');
  const scale = 10n ** BigInt(fraction.length);
  const numerator = BigInt(whole + fraction) * BigInt({ms: 1, s: 1000, m: 60000, h: 3600000}[unit]);
  if (numerator % scale) throw new Diagnostic('Time must resolve to whole milliseconds.', at, name);
  const ms = Number(numerator / scale);
  if (!Number.isSafeInteger(ms) || ms > 1e12) throw new Diagnostic('Time exceeds the supported range (10¹² ms).', at, name);
  return ms;
}

class Parser {
  constructor(text, source) { this.tokens = lex(text, source); this.i = 0; this.source = source; }
  get peek() { return this.tokens[this.i]; }
  take(kind, value) {
    const t = this.peek;
    if (t.kind !== kind || (value !== undefined && t.value !== value)) this.fail(`Expected ${value ?? kind}; found ${t.raw ?? 'end of file'}.`);
    this.i++; return t;
  }
  accept(kind) { if (this.peek.kind === kind) return this.tokens[this.i++]; return null; }
  word(word) { return this.take('id', word); }
  fail(message, at = this.peek) { throw new Diagnostic(message, at, this.source); }
  name() { return this.take('id'); }
}

export function compile(text) {
  const p = new Parser(text, 'policy'), events = new Map(), promises = [], names = new Set();
  while (p.peek.kind !== 'eof') {
    if (p.peek.value === 'event') {
      p.word('event'); const name = p.name();
      if (events.has(name.value)) p.fail(`Event ${name.value} is already declared.`, name);
      p.take('('); const fields = new Map();
      if (p.peek.kind !== ')') do {
        const field = p.name(); p.take(':'); const type = p.name();
        if (!['text', 'number', 'bool'].includes(type.value)) p.fail('Field type must be text, number, or bool.', type);
        if (fields.has(field.value)) p.fail(`Duplicate field ${field.value}.`, field);
        fields.set(field.value, {type: type.value, at: field});
      } while (p.accept(','));
      p.take(')'); p.take(';'); events.set(name.value, {name: name.value, fields, at: name});
    } else if (p.peek.value === 'promise') {
      p.word('promise'); const name = p.name();
      if (names.has(name.value)) p.fail(`Promise ${name.value} is already declared.`, name);
      names.add(name.value); p.take('{'); p.word('on'); const trigger = p.name(); p.take(';');
      const mode = p.name();
      if (!['expect', 'forbid'].includes(mode.value)) p.fail('Use expect or forbid.', mode);
      const target = p.name(); p.word(mode.value === 'expect' ? 'within' : 'for');
      const window = p.take('duration'); p.take(';'); p.word('match');
      const keys = [p.name()]; while (p.accept(',')) keys.push(p.name());
      p.take(';'); p.take('}');
      promises.push({name: name.value, trigger: trigger.value, target: target.value, mode: mode.value, window: window.value, keys: keys.map(k => k.value), at: name, triggerAt: trigger, targetAt: target, keyAts: keys});
    } else p.fail('Expected an event declaration or promise block.');
  }
  if (!events.size || !promises.length) p.fail('Declare at least one event and one promise.');
  if (promises.length > 100) p.fail('At most 100 promises are supported.');
  for (const rule of promises) {
    for (const [name, at] of [[rule.trigger, rule.triggerAt], [rule.target, rule.targetAt]])
      if (!events.has(name)) p.fail(`Event ${name} is not declared.`, at);
    const seen = new Set();
    rule.keys.forEach((key, i) => {
      const a = events.get(rule.trigger).fields.get(key), b = events.get(rule.target).fields.get(key);
      if (seen.has(key)) p.fail(`Duplicate correlation field ${key}.`, rule.keyAts[i]);
      seen.add(key);
      if (!a || !b) p.fail(`Correlation field ${key} must exist on ${rule.trigger} and ${rule.target}.`, rule.keyAts[i]);
      if (a.type !== b.type) p.fail(`Correlation field ${key} has incompatible types (${a.type} / ${b.type}).`, rule.keyAts[i]);
    });
  }
  return {events, promises, source: text};
}

export function parseTrace(text, program) {
  const p = new Parser(text, 'events'), events = []; let previous = -1;
  while (p.peek.kind !== 'eof') {
    const time = p.take('duration'), name = p.name(), schema = program.events.get(name.value);
    if (!schema) p.fail(`Unknown event ${name.value}.`, name);
    if (time.value < previous) p.fail('Events must be chronological. Equal timestamps use written order.', time);
    previous = time.value; p.take('('); const values = Object.create(null);
    if (p.peek.kind !== ')') do {
      const field = p.name(); p.take(':'); const value = p.peek; p.i++;
      if (Object.hasOwn(values, field.value)) p.fail(`Duplicate value for ${field.value}.`, field);
      const expected = schema.fields.get(field.value);
      if (!expected) p.fail(`Event ${name.value} has no field ${field.value}.`, field);
      let type = value.kind, converted = value.value;
      if (type === 'string') type = 'text';
      if (type === 'id' && ['true', 'false'].includes(value.value)) { type = 'bool'; converted = value.value === 'true'; }
      if (type !== expected.type) p.fail(`${field.value} expects ${expected.type}, received ${type}.`, value);
      values[field.value] = converted;
    } while (p.accept(','));
    p.take(')'); p.take(';');
    for (const key of schema.fields.keys()) if (!Object.hasOwn(values, key)) p.fail(`Missing ${name.value}.${key}.`, name);
    events.push({id: `E${String(events.length + 1).padStart(2, '0')}`, index: events.length, time: time.value, name: name.value, values, at: time});
    if (events.length > 1000) p.fail('At most 1,000 events are supported.', time);
  }
  return events;
}

export function evaluate(program, events, now) {
  if (!Number.isSafeInteger(now) || now < 0 || now > 2e12) throw new Diagnostic('Observation time must be a nonnegative whole millisecond within range.', {}, 'clock');
  const visible = events.filter(e => e.time <= now), results = [];
  for (const trigger of visible) for (const rule of program.promises) {
    if (trigger.name !== rule.trigger) continue;
    const deadline = trigger.time + rule.window;
    const candidates = visible.filter(e => e.index > trigger.index && e.time <= deadline && e.name === rule.target);
    const matched = candidates.find(e => rule.keys.every(k => e.values[k] === trigger.values[k]));
    const status = matched ? (rule.mode === 'expect' ? 'fulfilled' : 'violated') : now >= deadline ? (rule.mode === 'expect' ? 'violated' : 'fulfilled') : 'pending';
    const witness = status === 'violated' ? rule.mode === 'forbid'
      ? {kind: 'forbidden-event', eventIds: [trigger.id, matched.id], closedAt: matched.time, explanation: 'Two events suffice: the trigger and the first correlated forbidden event.'}
      : {kind: 'missing-event', eventIds: [trigger.id], closedAt: deadline, explanation: 'One trigger plus the closed observation window. Absence depends on the complete supplied trace prefix, not just the displayed event.'}
      : null;
    results.push({id: `${rule.name}:${trigger.id}`, rule, trigger, deadline, status, matched, witness,
      rejected: candidates.filter(e => !rule.keys.every(k => e.values[k] === trigger.values[k])).map(e => ({event: e, fields: rule.keys.filter(k => e.values[k] !== trigger.values[k])})),
      resolvedAt: matched?.time ?? (now >= deadline ? deadline : null)});
  }
  return {now, visible, results, counts: ['pending', 'fulfilled', 'violated'].reduce((a, k) => ({...a, [k]: results.filter(r => r.status === k).length}), {})};
}

export function timelineEnd(program, events) {
  return Math.max(1000, ...events.map(e => e.time), ...events.flatMap(e => program.promises.filter(p => p.trigger === e.name).map(p => e.time + p.window)));
}
export function formatTime(ms) { return ms >= 60000 && ms % 60000 === 0 ? `${ms / 60000}m` : ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`; }
