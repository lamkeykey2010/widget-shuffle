import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/levels.mjs';
import {legacyRanks} from '../src/legacy.mjs';
import {inspect,initialPlacements,solve,finished} from '../src/logic.mjs';
import {analyze} from '../src/analysis.mjs';
import {dailyPuzzle,hongKongDay,validDay} from '../src/daily.mjs';
import {readRoute,shareHash} from '../src/routing.mjs';
import {decodeProgress,readDailyArchive,storeDailyProgress} from '../src/state.mjs';
import {independentlySolve} from './independent-solver.mjs';

test('campaign introduces mechanics in chapters and retains Expert reasoning',()=>{
 for(const level of Object.values(levels)){
  assert.equal(level.chapter,Math.ceil(level.rank/10));
  if(level.rank<21)assert.ok(!level.locked?.length&&!level.blocked?.length&&!level.apps.some(a=>a.shape));
  if(level.rank>=71){const a=analyze(level).stats;assert.equal(level.difficulty,'Expert');assert.ok(a.maxDepth>=1);assert.ok(a.strongUnresolved>=4);}
 }
 assert.ok(levels[21].locked.length);assert.ok(levels[31].blocked.length);assert.ok(levels[41].apps.some(a=>a.shape));
 assert.ok(levels[51].locked.length&&levels[51].blocked.length);assert.ok(levels[91].blocked.length&&levels[91].apps.some(a=>a.shape));
});
test('all hundred campaign ratings rise without backward steps',()=>{
 for(let rank=2;rank<=100;rank++)assert.ok(levels[rank].rating.score>=levels[rank-1].rating.score,`Difficulty drops at level ${rank}`);
});
test('locked widgets cannot change shape or disappear from saved progress',()=>{
 const level=levels[21],givens=initialPlacements(level),solution=solve(level,1)[0];
 assert.ok(givens.length);assert.equal(decodeProgress(level,{placed:[]}),null);
 assert.ok(decodeProgress(level,{placed:givens}));
 const edited=initialPlacements(level);edited[0].cells.pop();assert.notDeepEqual(edited,givens);assert.ok(givens[0].cells.length>edited[0].cells.length);
 assert.ok(finished(level,solution));assert.equal(finished(level,solution.filter(p=>p.id!==givens[0].id)),false);
});
test('blocked spaces and shape requirements are enforced independently of completion',()=>{
 const blocked={cols:3,rows:2,apps:[{id:'app',name:'App',i:0,area:6}],blocked:[5]};
 assert.equal(inspect(blocked,[0,1,2,3,4,5]).ok,false);
 const tall={cols:3,rows:2,apps:[{id:'app',name:'App',i:0,area:6,shape:'tall'}]};
 assert.equal(inspect(tall,[0,1,2,3,4,5]).ok,false);tall.apps[0].shape='wide';assert.equal(inspect(tall,[0,1,2,3,4,5]).ok,true);
 const level=levels[31];assert.ok(finished(level,independentlySolve(level)[0]));
});
test('daily changes exactly at midnight Hong Kong time, including leap dates',()=>{
 assert.equal(hongKongDay(new Date('2026-10-22T15:59:59Z')),'2026-10-22');
 assert.equal(hongKongDay(new Date('2026-10-22T16:00:00Z')),'2026-10-23');
 assert.equal(validDay('2028-02-29'),true);for(const day of ['2026-02-29','2026-13-01','bad','2026-10-32'])assert.equal(validDay(day),false);
 assert.deepEqual(readRoute('#daily=today',new Date('2026-10-22T16:00:00Z')),{daily:'2026-10-23'});
});
test('thirty daily puzzles are Expert, independently unique, deterministic and dated',()=>{
 const boards=new Set();
 for(let d=1;d<=30;d++){
  const day=`2026-11-${String(d).padStart(2,'0')}`,level=dailyPuzzle(day),answers=independentlySolve(level),rating=analyze(level).stats;
  assert.equal(level.daily,day);assert.equal(level.difficulty,'Expert');assert.equal(answers.length,1);assert.ok(finished(level,answers[0]));assert.ok(rating.maxDepth>=2);assert.ok(rating.strongUnresolved>=4);
  const key=JSON.stringify([level.cols,level.rows,level.apps.map(a=>[a.i,a.area])]);assert.ok(!boards.has(key));boards.add(key);
  assert.deepEqual(readRoute(shareHash(level)),{daily:day});
 }
 assert.deepEqual(dailyPuzzle('2026-11-01'),dailyPuzzle('2026-11-01'));
});
test('legacy campaign links retain their boards and new links cover all hundred levels',()=>{
 for(const [oldRank,newRank] of Object.entries(legacyRanks))assert.deepEqual(readRoute(`#level=${oldRank}`),{rank:String(newRank)});
 for(let rank=1;rank<=100;rank++)assert.deepEqual(readRoute(shareHash(levels[rank])),{rank:String(rank)});
 assert.deepEqual(readRoute('#seed=v1-morning-coffee'),{seed:'v1-morning-coffee'});
 assert.throws(()=>readRoute('#daily=2026-02-29'));assert.throws(()=>readRoute('#daily=2026-10-22&dv=2'));assert.throws(()=>readRoute('#campaign=3&level=50'));
});
test('daily records are separate, bounded and discard invalid dates and duplicate records',()=>{
 let archive=[];for(let d=1;d<=40;d++){const day=new Date(Date.UTC(2026,9,d)).toISOString().slice(0,10);archive=storeDailyProgress(archive,day,{placed:[]},null);}
 assert.equal(archive.length,32);assert.deepEqual(readDailyArchive([null,{day:'bad'},...archive,archive[0]]),archive);
 const daily=dailyPuzzle('2026-10-22'),progress={placed:solve(daily,1)[0],hints:0,moves:15,elapsed:100,started:true};
 archive=storeDailyProgress(archive,daily.daily,progress,{hints:0,moves:15,elapsed:100});assert.ok(finished(daily,decodeProgress(daily,archive[0].progress).placed));
});
