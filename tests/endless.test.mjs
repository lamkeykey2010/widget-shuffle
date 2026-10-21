import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {puzzleFromSeed,normalizeSeed,routeFromHash,puzzleHash,generatePuzzle} from '../src/generator.mjs';
import {finished,solve} from '../src/logic.mjs';
import {decodeProgress,readEndlessArchive,storeEndlessProgress} from '../src/state.mjs';
import {independentlySolve} from './independent-solver.mjs';
import {analyze} from '../src/analysis.mjs';

const seeds=Array.from({length:120},(_,i)=>`v1-sample-${i}`);
test('120 different seeds produce distinct independently unique, playable puzzles',()=>{
 const boards=new Set(),difficulties=new Set(),orientations=new Set();
 for(const seed of seeds){
  const level=puzzleFromSeed(seed),answers=independentlySolve(level);
  assert.equal(answers.length,1,seed);assert.ok(finished(level,answers[0]),seed);
  assert.equal(new Set(level.apps.map(a=>a.id)).size,level.apps.length);
  assert.equal(level.apps.reduce((n,a)=>n+a.area,0),level.cols*level.rows);
  assert.equal(level.orientation,level.cols>level.rows?'landscape':'portrait');
  const key=JSON.stringify([level.cols,level.rows,level.apps.map(a=>[a.i,a.area])]);assert.ok(!boards.has(key),seed);boards.add(key);
  difficulties.add(level.difficulty);orientations.add(level.orientation);
  if(['Hard','Expert'].includes(level.difficulty)){
   const rating=analyze(level).stats;
   assert.ok(rating.basicUnresolved>=3,seed);
   if(level.difficulty==='Expert'){assert.ok(rating.strongUnresolved>=4,seed);assert.ok(rating.maxDepth>=1,seed);}
  }
 }
 assert.deepEqual([...difficulties].sort(),['Easy','Expert','Hard','Medium']);
 assert.deepEqual([...orientations].sort(),['landscape','portrait']);
});

test('same normalized seed always recreates the entire screen independent of generation order',()=>{
 const first=puzzleFromSeed('v1-morning-coffee');
 for(const seed of seeds.slice(0,15))puzzleFromSeed(seed);
 assert.deepEqual(puzzleFromSeed(' V1-MORNING-COFFEE '),first);
 assert.equal(puzzleHash(first),'#seed=v1-morning-coffee');
 assert.deepEqual(routeFromHash(puzzleHash(first)),{seed:first.seed});
});

test('seed links normalize case and reject unsupported versions or unsafe input',()=>{
 assert.equal(normalizeSeed(' V1-FRIENDS '),'v1-friends');
 assert.deepEqual(routeFromHash('#level=7'),{rank:'7'});
 assert.deepEqual(routeFromHash('#seed=v1-friends&level=2'),{seed:'v1-friends'});
 for(const seed of ['',null,'v2-future','v1-','v1-<script>','v1-a b','v1-'+ 'a'.repeat(41),'v1-a%26level=1'])assert.throws(()=>normalizeSeed(seed));
 assert.deepEqual(routeFromHash('#level=999'),{rank:'1'});
});

test('generation is bounded by deterministic work rather than a clock deadline',()=>{
 const iterator=generatePuzzle('v1-sample-1');let steps=0,step;
 do{step=iterator.next();steps++;assert.ok(steps<=601);}while(!step.done);
 assert.deepEqual(step.value,puzzleFromSeed('v1-sample-1'));
 assert.throws(()=>solve(step.value,2,0),/Solver budget exceeded/);
});

test('Endless progress is validated against its seed and bounded to twelve saved puzzles',()=>{
 const a=puzzleFromSeed('v1-sample-3'),b=puzzleFromSeed('v1-sample-1');
 const progress={placed:solve(a,1)[0],hints:0,moves:6,elapsed:30,started:true},best={hints:0,moves:6,elapsed:30};
 assert.ok(finished(a,decodeProgress(a,progress).placed));assert.equal(decodeProgress(b,progress),null);
 let archive=[];
 for(let i=0;i<16;i++)archive=storeEndlessProgress(archive,`v1-archive-${i}`,{placed:[]},null);
 assert.equal(archive.length,12);assert.equal(archive[0].seed,'v1-archive-15');
 archive=storeEndlessProgress(archive,a.seed,progress,best);
 assert.equal(archive.length,12);assert.deepEqual(archive[0],{seed:a.seed,progress,best});
 assert.deepEqual(readEndlessArchive([null,{}, {seed:'v2-bad'}, ...archive,archive[0]]),archive);
 assert.equal(readEndlessArchive([{seed:a.seed,progress,best:{hints:-1,moves:0,elapsed:0}}])[0].best,null);
});

test('v1 published seed fixtures pin board generation for future updates',()=>{
 const fingerprints={};
 for(const seed of ['v1-morning-coffee','v1-sample-0','v1-sample-3','v1-sample-7']){
  fingerprints[seed]=createHash('sha256').update(JSON.stringify(puzzleFromSeed(seed))).digest('hex');
 }
 // Filled from the frozen v1 release after independent uniqueness checks.
 assert.deepEqual(fingerprints,V1_FIXTURES);
});

const V1_FIXTURES={
  "v1-morning-coffee": "7c165636dc8eb4ead5be56cc966bccaab10f53eed12d2d9935361a757663bf88",
  "v1-sample-0": "9ed05b9a9bc88a28885db5f818ad28346e182d3b708c5e5fc079df310c6c9148",
  "v1-sample-3": "e394bf9b748d08ebd79a68fb21b917147c717adc0adb3c48fb41e773082823c7",
  "v1-sample-7": "bac2c80f8478ca8ad23b683bfebedef51735b5c907e5fc598907903cefee3c52"
};
