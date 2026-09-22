import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compile, parseTrace, evaluate, lex, timelineEnd, formatTime} from '../src/engine.js';
import {spawnSync} from 'node:child_process';
import {readExperiment} from '../src/experiment.js';
import {examples} from '../src/examples.js';
const policy = `event Begin(id:text); event Done(id:text); promise P { on Begin; expect Done within 1s; match id; }`;
const run = (trace, now, text=policy) => { const p=compile(text);return evaluate(p,parseTrace(trace,p),now); };
test('deadline is inclusive and no premature absence verdict',()=>{
 const t='0s Begin(id:"x"); 1s Done(id:"x");';
 assert.equal(run(t,999).results[0].status,'pending');assert.equal(run(t,1000).results[0].status,'fulfilled');
 assert.equal(run('0s Begin(id:"x");',999).results[0].status,'pending');
 assert.equal(run('0s Begin(id:"x");',1000).results[0].status,'violated');
});
test('future health event never retroactively repairs expired obligation',()=>{
 const t='0s Begin(id:"x"); 1001ms Done(id:"x");';
 assert.equal(run(t,2000).results[0].status,'violated');
});
test('typed correlation rejects look-alike events',()=>{
 const r=run('0s Begin(id:"api"); 0.5s Done(id:"web");',1000).results[0];
 assert.equal(r.status,'violated');assert.deepEqual(r.rejected[0].fields,['id']);
});
test('forbidden interval includes deadline, stays pending before it',()=>{
 const p=policy.replace('expect Done within','forbid Done for');
 assert.equal(run('0s Begin(id:"x");',999,p).results[0].status,'pending');
 assert.equal(run('0s Begin(id:"x");',1000,p).results[0].status,'fulfilled');
 const r=run('0s Begin(id:"x"); 1s Done(id:"x");',1000,p).results[0];
 assert.equal(r.status,'violated');assert.deepEqual(r.witness.eventIds,['E01','E02']);
});
test('same timestamp respects written order, trigger cannot match itself',()=>{
 assert.equal(run('0s Done(id:"x"); 0s Begin(id:"x");',1000).results[0].status,'violated');
 assert.equal(run('0s Begin(id:"x"); 0s Done(id:"x");',0).results[0].status,'fulfilled');
 const p=policy.replace('expect Done','expect Begin');
 assert.equal(run('0s Begin(id:"x");',1000,p).results[0].status,'violated');
});
test('zero-length windows only accept subsequent same-time events',()=>{
 const p=policy.replace('1s','0ms');
 assert.equal(run('0s Begin(id:"x");',0,p).results[0].status,'violated');
 assert.equal(run('0s Begin(id:"x"); 0s Done(id:"x");',0,p).results[0].status,'fulfilled');
});
test('overlapping promises use explicit broadcast matching',()=>{
 const r=run('0s Begin(id:"x"); 100ms Begin(id:"x"); 500ms Done(id:"x");',500);
 assert.equal(r.counts.fulfilled,2);assert.equal(r.results[0].matched.id,r.results[1].matched.id);
});
test('time conversion is exact at millisecond resolution',()=>{
 assert.equal(lex('0.001s')[0].value,1);assert.equal(lex('0.00005m')[0].value,3);
 assert.throws(()=>lex('0.1ms'),/whole milliseconds/);assert.throws(()=>lex('99999999999999999h'),/range/);
});
test('compiler catches schema mismatch with source positions',()=>{
 assert.throws(()=>compile(policy.replace('Done(id:text)','Done(id:number)')),e=>e.line===1&&e.column>0&&/incompatible/.test(e.message));
 assert.throws(()=>compile(policy.replace('match id','match missing')),/must exist/);
 assert.throws(()=>compile(policy.replace('expect Done','expect Missing')),/not declared/);
 assert.throws(()=>compile(policy.replace('within 1s;','within 1s')),/Expected ;/);
});
test('schema values are strict, finite and complete',()=>{
 const p=compile(policy);
 for(const t of ['0s Begin(id:2);','0s Begin();','0s Begin(id:"x",id:"y");','0s Begin(nope:"x");','0s Unknown(id:"x");'])assert.throws(()=>parseTrace(t,p));
 assert.throws(()=>lex('1e999'),/finite/);
});
test('event time cannot go backwards',()=>assert.throws(()=>run('1s Begin(id:"x"); 0s Done(id:"x");',1000),/chronological/));
test('prototype-shaped field names remain plain data',()=>{
 const p='event A(__proto__:text); event B(__proto__:text); promise P {on A; expect B within 1s; match __proto__;}';
 assert.equal(run('0s A(__proto__:"x"); 1s B(__proto__:"x");',1000,p).counts.fulfilled,1);
});
test('negative watermark rejected; empty trace carries no obligations',()=>{
 assert.throws(()=>run('',-1),/Observation time/);assert.equal(run('',0).results.length,0);
});
test('all three fixtures retain documented final outcomes',()=>{
 const expected=[{pending:0,fulfilled:2,violated:2},{pending:0,fulfilled:1,violated:1},{pending:0,fulfilled:2,violated:2}];
 examples.forEach((ex,i)=>{const p=compile(ex.policy),t=parseTrace(ex.trace,p);assert.deepEqual(evaluate(p,t,timelineEnd(p,t)).counts,expected[i]);});
});
test('import validates sources before accepting and ignores alleged results',()=>{
 const obj={format:'traceweaver/1',policy,trace:'0s Begin(id:"x");',watermark:1000,results:{fulfilled:999}};
 const got=readExperiment(JSON.stringify(obj));assert.equal('results' in got,false);assert.equal(run(got.trace,got.watermark,got.policy).counts.violated,1);
 assert.throws(()=>readExperiment(JSON.stringify({...obj,watermark:1001})),/Watermark/);
 assert.throws(()=>readExperiment(JSON.stringify({...obj,trace:'bad'})));
 assert.throws(()=>readExperiment('null'));assert.throws(()=>readExperiment('nope'));
});
test('time labels preserve millisecond distinctions across minute boundary',()=>{
 assert.equal(formatTime(60000),'1m'); assert.equal(formatTime(60001),'60.001s');
 assert.equal(formatTime(59999),'59.999s');
});
test('unknown time units explain supported units at the source location',()=>{
 assert.throws(()=>compile(policy.replace('1s','2kg')),e=>/Unknown time unit kg/.test(e.message)&&/ms, s, m, or h/.test(e.message)&&e.column>0);
 assert.equal(lex('1e2')[0].value,100);
});
test('CLI reports real interpreter outcomes and separates invalid input',()=>{
 const result=spawnSync(process.execPath,['src/cli.js','examples/deploy.weave','examples/deploy.trace','--at','30000'],{encoding:'utf8'});
 assert.equal(result.status,1); assert.deepEqual(JSON.parse(result.stdout).counts,{pending:0,fulfilled:2,violated:2});
 const invalid=spawnSync(process.execPath,['src/cli.js','examples/deploy.weave','examples/deploy.trace','--at','NaN'],{encoding:'utf8'});
 assert.equal(invalid.status,2);assert.match(invalid.stderr,/Observation time/);
});
