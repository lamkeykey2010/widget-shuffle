import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/levels.mjs';
import {solve,finished,inspect,cellsFor} from '../src/logic.mjs';
import {decodeProgress,validBest,isBetter} from '../src/state.mjs';
import {analyze} from '../scripts/difficulty.mjs';
import {independentlySolve} from './independent-solver.mjs';
for(const [rank,level] of Object.entries(levels))test(`Level ${rank}: one independently verified complete layout`,()=>{
 const independent=independentlySolve(level),actual=solve(level);
 assert.equal(independent.length,1);assert.equal(actual.length,1);assert.ok(finished(level,actual[0]));assert.ok(finished(level,independent[0]));
 assert.equal(level.apps.reduce((n,a)=>n+a.area,0),level.cols*level.rows);
 const saved=decodeProgress(level,{placed:actual[0],moves:17,hints:1,elapsed:124,started:true});assert.ok(saved);assert.ok(finished(level,saved.placed));
 for(const p of actual[0]){const reversed=cellsFor(level.cols,Math.max(...p.cells),Math.min(...p.cells));assert.ok(inspect(level,reversed).ok);}
});
test('ten distinct boards and stable original challenge identities',()=>{
 assert.equal(Object.keys(levels).length,10);assert.deepEqual(Object.values(levels).map(l=>l.rank),[1,2,3,4,5,6,7,8,9,10]);
 const layouts=new Set(Object.values(levels).map(l=>JSON.stringify([l.cols,l.rows,l.apps.map(a=>[a.i,a.area])])));assert.equal(layouts.size,10);
 assert.equal(levels[1].id,'first-screen-v1');assert.equal(levels[7].id,'hard-screen-v1');assert.equal(levels[10].id,'expert-screen-v1');
});
test('later challenge requires deeper look-ahead under the same analyzer',()=>{
 assert.equal(analyze(levels[1]).stats.maxDepth,0);assert.equal(analyze(levels[7]).stats.initialSingles,0);assert.ok(analyze(levels[10]).stats.maxDepth>analyze(levels[7]).stats.maxDepth);
});
test('device frames and orientation are fixed per level',()=>{
 for(const level of Object.values(levels)){assert.equal(level.device,level.rank>=6?'tablet':'phone');assert.equal(level.orientation,[8,9].includes(level.rank)?'landscape':'portrait');assert.equal(level.cols>level.rows,level.orientation==='landscape');}
});
test('invalid area, multiple apps and overlap leave placements unchanged',()=>{
 const level=levels[1],placed=[{id:'weather',cells:[0,1,4,5]}],before=JSON.stringify(placed);
 assert.equal(inspect(level,[0,1],[]).ok,false);assert.equal(inspect(level,[0,1,2,3],[]).ok,false);assert.equal(inspect(level,[0,1,4,5],placed).ok,false);assert.equal(JSON.stringify(placed),before);
});
test('invalid saved states and corrupt records cannot create fake completion',()=>{
 const level=levels[1];
 for(const data of [null,{}, {placed:[{id:'weather',cells:[-1,0,3,4]}]}, {placed:[{id:'fake',cells:[0,1,4,5]}]}, {placed:[{id:'weather',cells:[0,1,4,5]},{id:'weather',cells:[0,1,4,5]}]}])assert.equal(decodeProgress(level,data),null);
 const saved=decodeProgress(level,{placed:[],hints:-2,moves:'bad',elapsed:Infinity,started:false});assert.equal(saved.hints,0);assert.equal(saved.moves,0);assert.equal(saved.elapsed,0);
 assert.equal(validBest({elapsed:-1,moves:2,hints:0}),false);assert.equal(validBest({elapsed:0,moves:0,hints:0}),true);
});
test('completion records rank fewer hints before faster time',()=>{
 const previous={elapsed:60,moves:8,hints:0};assert.equal(isBetter({elapsed:1,moves:6,hints:1},previous),false);assert.equal(isBetter({elapsed:50,moves:9,hints:0},previous),true);assert.equal(isBetter({elapsed:60,moves:7,hints:0},previous),true);
});
test('nonrectangular, duplicate and off-screen selections are rejected',()=>{
 for(const cells of [[0,1,5],[0,1,4,4],[-1,0,3,4],[20,21,24,25],[0,1,4,'5']])assert.equal(inspect(levels[1],cells).ok,false);
});
