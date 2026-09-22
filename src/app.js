import {compile, parseTrace, evaluate, timelineEnd, formatTime} from './engine.js';
import {examples} from './examples.js';
import {readExperiment} from './experiment.js';
const $ = id => document.getElementById(id);
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let program, events = [], end = 1000, now = 0, selected = '', active = 0, timer = null, dirty = false;
function stop() { clearInterval(timer); timer = null; $('play').textContent = '▶ Play'; }
function notice(message) { $('toast').textContent = message; $('toast').style.display = 'block'; setTimeout(() => $('toast').style.display = 'none', 3500); }
function setVisible(value) { document.querySelector('.replay').hidden = !value; document.querySelector('.results-heading').hidden = !value; document.querySelector('.results-grid').hidden = !value; }
function run(initial) {
  stop();
  try {
    const next = compile($('policy').value), nextEvents = parseTrace($('trace').value, next);
    program = next; events = nextEvents; end = timelineEnd(program, events);
    now = Math.min(end, initial ?? now); dirty = false; selected = '';
    $('diagnostic').hidden = true; $('compile-status').textContent = `${program.events.size} event types · ${program.promises.length} typed promises · ${events.length} events`;
    $('scrub').max = end; setVisible(true); render(); return true;
  } catch (e) {
    $('compile-status').textContent = 'No evaluation: fix the diagnostic below.';
    $('diagnostic').hidden = false; $('diagnostic').textContent = `${e.source ?? 'source'}:${e.line ?? 1}:${e.column ?? 1}  ${e.message}`;
    setVisible(false); return false;
  }
}
function load(index) {
  stop(); active = index; const example = examples[index];
  $('policy').value = example.policy; $('trace').value = example.trace;
  $('story-title').textContent = example.name; $('story-description').textContent = example.description;
  document.querySelector('.fixture').textContent = 'SYNTHETIC EXAMPLE';
  for (const [i, button] of [...$('examples').children].entries()) { button.classList.toggle('active', i === index); button.setAttribute('aria-pressed', i === index); }
  run(example.initial);
}
function identity(result) { return result.rule.keys.map(k => `${k}=${JSON.stringify(result.trigger.values[k])}`).join(', '); }
function renderTimeline(state, focused) {
  const names = [...program.events.keys()], width = 1060, left = 115, usable = width - left - 85, height = 50 + names.length * 48;
  const x = t => left + usable * t / end;
  const highlight = new Set(focused ? [focused.trigger.id, focused.matched?.id].filter(Boolean) : []);
  let svg = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Observed events by event type, with the selected promise highlighted"><rect x="${left}" y="12" width="${Math.max(0, x(now) - left)}" height="${height - 20}" fill="#edf0fa" rx="4"/>`;
  for (let i = 0; i < names.length; i++) {
    const y = 36 + i * 48;
    svg += `<text x="0" y="${y + 4}" fill="#70777b" font-family="monospace" font-size="11">${esc(names[i])}</text><line x1="${left}" y1="${y}" x2="${width - 45}" y2="${y}" stroke="#dde0da"/>`;
    for (const event of state.visible.filter(e => e.name === names[i])) {
      const chosen = highlight.has(event.id), color = chosen ? '#4056d8' : '#8a9394';
      svg += `<circle cx="${x(event.time)}" cy="${y}" r="${chosen ? 6 : 4}" fill="${color}" stroke="#fffefa" stroke-width="2"><title>${esc(`${event.id} ${formatTime(event.time)} ${event.name} ${JSON.stringify(event.values)}`)}</title></circle><text x="${x(event.time) + 9}" y="${y - 10}" fill="${color}" font-family="monospace" font-size="9">${esc(event.id)} · ${esc(formatTime(event.time))}</text>`;
    }
  }
  svg += `<line x1="${x(now)}" y1="8" x2="${x(now)}" y2="${height - 5}" stroke="#4056d8" stroke-width="1.5" stroke-dasharray="3 4"/>`;
  if (focused) svg += `<line x1="${x(focused.deadline)}" y1="10" x2="${x(focused.deadline)}" y2="${height - 5}" stroke="#b34835" stroke-dasharray="2 5"/><text x="${x(focused.deadline) - 4}" y="${height - 1}" text-anchor="end" fill="#b34835" font-family="monospace" font-size="9">deadline ${esc(formatTime(focused.deadline))}</text>`;
  $('timeline').innerHTML = svg + '</svg>';
}
function renderWitness(result) {
  if (!result) { $('witness').innerHTML = '<p class="eyebrow">NOTHING TO CHECK YET</p><h3>Every story needs a beginning.</h3><p>Advance the clock until a trigger event appears, or add events to your trace.</p>'; return; }
  const title = result.status === 'violated' ? 'The smallest useful witness.' : result.status === 'pending' ? 'There is still time.' : 'This promise held.';
  let body = `<p class="eyebrow">${esc(result.rule.name)} / ${esc(result.status.toUpperCase())}</p><h3>${title}</h3><p>${esc(result.rule.mode === 'expect' ? `After ${result.rule.trigger}, expect ${result.rule.target} within ${formatTime(result.rule.window)}.` : `After ${result.rule.trigger}, forbid ${result.rule.target} for ${formatTime(result.rule.window)}.`)}</p>`;
  body += `<div class="evidence"><span>TRIGGER / ${esc(result.trigger.id)} AT ${esc(formatTime(result.trigger.time))}</span>${esc(identity(result))}</div>`;
  if (result.matched) body += `<div class="evidence"><span>${result.rule.mode === 'expect' ? 'MATCH' : 'FORBIDDEN MATCH'} / ${esc(result.matched.id)} AT ${esc(formatTime(result.matched.time))}</span>${esc(result.matched.name)} — ${esc(JSON.stringify(result.matched.values))}</div>`;
  else body += `<div class="evidence"><span>${now >= result.deadline ? 'CLOSED' : 'OPEN'} WINDOW / THROUGH ${esc(formatTime(result.deadline))}</span>${now >= result.deadline ? 'No correlated target event in this complete supplied window.' : `${esc(formatTime(result.deadline - now))} remains. No conclusion from absence yet.`}</div>`;
  if (result.witness) body += `<p>${esc(result.witness.explanation)}</p>`;
  if (result.rejected.length) body += `<p><strong>${result.rejected.length} look-alike event${result.rejected.length === 1 ? '' : 's'} rejected.</strong> ${result.rejected.map(r => `${esc(r.event.id)} differs on ${r.fields.map(esc).join(', ')}`).join('; ')}.</p>`;
  body += '<p class="witness-caveat">Only the supplied trace is evaluated. Missing telemetry is indistinguishable from an event that did not happen.</p>';
  if (result.status !== 'pending') body += '<button id="jump">Jump to resolution ↗</button>';
  $('witness').innerHTML = body;
  $('jump')?.addEventListener('click', () => { stop(); now = result.resolvedAt; render(); });
}
function render() {
  const state = evaluate(program, events, now);
  if (!state.results.some(r => r.id === selected)) selected = state.results.find(r => r.status === 'violated')?.id ?? state.results[0]?.id ?? '';
  const focused = state.results.find(r => r.id === selected);
  $('clock').textContent = formatTime(now); $('scrub').value = now; $('scrub').setAttribute('aria-valuetext', `${formatTime(now)} complete-through observation time`); $('end-time').textContent = formatTime(end);
  $('counts').innerHTML = ['violated', 'pending', 'fulfilled'].map(k => `<span class="badge ${k}">${state.counts[k]} ${k}</span>`).join('');
  $('obligations').innerHTML = state.results.length ? state.results.map(r => `<button class="obligation ${r.id === selected ? 'selected' : ''}" data-result="${esc(r.id)}" aria-pressed="${r.id === selected}"><div class="row"><strong>${esc(r.rule.name)}</strong><span class="badge ${r.status}">${r.status}</span></div><small>${esc(identity(r))}<br>${esc(r.trigger.id)} · ${esc(formatTime(r.trigger.time))} → ${esc(formatTime(r.deadline))} deadline</small></button>`).join('') : '<div class="empty">No trigger has been observed. Move the clock forward.</div>';
  for (const button of $('obligations').querySelectorAll('button')) button.addEventListener('click', () => { selected = button.dataset.result; render(); });
  renderTimeline(state, focused); renderWitness(focused); $('step').disabled = now >= end;
}
for (const [i, example] of examples.entries()) { const b = document.createElement('button'); b.textContent = example.label; b.addEventListener('click', () => load(i)); $('examples').append(b); }
$('reset').addEventListener('click', () => load(active));
$('run').addEventListener('click', () => run());
for (const id of ['policy', 'trace']) $(id).addEventListener('input', () => { stop(); dirty = true; setVisible(false); $('compile-status').textContent = 'Source changed. Compile to evaluate this version.'; $('diagnostic').hidden = true; document.querySelector('.fixture').textContent = 'EDITED LOCAL TRACE'; });
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
$('scrub').addEventListener('input', e => { stop(); now = Number(e.target.value); render(); });
$('start').addEventListener('click', () => { stop(); now = 0; render(); });
$('step').addEventListener('click', () => {
  stop(); const moments = [...events.map(e => e.time), ...evaluate(program, events, end).results.map(r => r.deadline), end];
  now = Math.min(...moments.filter(t => t > now)); render();
});
$('play').addEventListener('click', () => {
  if (timer) return stop(); if (now >= end) now = 0;
  $('play').textContent = 'Ⅱ Pause';
  timer = setInterval(() => { now = Math.min(end, now + Math.max(1, Math.round(end / 200))); render(); if (now === end) stop(); }, 60);
});
$('export').addEventListener('click', () => {
  if (dirty && !run()) return notice('Fix the source diagnostic before exporting.');
  const data = {format:'traceweaver/1', policy:$('policy').value, trace:$('trace').value, watermark:now, label:$('story-title').textContent};
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = 'traceweaver-experiment.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  notice('Exported sources + watermark. Results will be recomputed.');
});
$('import').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    if (file.size > 250000) throw new Error('Experiment exceeds 250 KB.');
    const data = readExperiment(await file.text());
    stop(); $('policy').value = data.policy; $('trace').value = data.trace;
    $('story-title').textContent = data.label; $('story-description').textContent = 'Imported local experiment. Only source and observation time are trusted; results are recomputed.';
    document.querySelector('.fixture').textContent = 'IMPORTED LOCAL TRACE';
    for (const b of $('examples').children) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); }
    run(data.watermark); notice('Imported and recomputed. Stored results are ignored.');
  } catch (error) { notice(`Import rejected: ${error.message}`); }
  e.target.value = '';
});
load(0);
