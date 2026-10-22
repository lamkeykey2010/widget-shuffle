import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {legacyLevels,legacyRanks} from '../src/legacy.mjs';
import {puzzleFromSeed} from '../src/generator.mjs';
import {solve} from '../src/logic.mjs';
import {analyze} from '../src/analysis.mjs';

const chapters=[
 ['First steps','Easy',[]],['Finding your flow','Medium',[]],
 ['Stay in place','Hard',['locked']],['Make some space','Hard',['blocked']],
 ['A different shape','Hard',['shape']],['Around the dock','Expert',['locked','blocked']],
 ['Turn the screen','Expert',['blocked','shape']],['Think ahead','Expert',[]],
 ['Everything connects','Expert',['locked','shape']],['One last arrangement','Expert',['blocked','shape']]
];
await mkdir(new URL('../.authoring/',import.meta.url),{recursive:true});
let pool=[];const poolPath=new URL('../.authoring/source-pool-v2.json',import.meta.url);
try{pool=JSON.parse(await readFile(poolPath,'utf8'));}catch{}
for(let i=pool.length;i<600;i++){
 const candidate=puzzleFromSeed(`v1-campaign-100-${i}`);pool.push(candidate);
 if(i%100===99)console.log(`Prepared ${i+1} source puzzles`);
}
await writeFile(poolPath,JSON.stringify(pool));
const keyOf=p=>JSON.stringify([p.cols,p.rows,p.apps.map(a=>[a.i,a.area]),p.blocked||[],p.locked||[]]);
function addMechanics(source,mechanics,variant=0){
 const level=JSON.parse(JSON.stringify(source));delete level.seed;delete level.rank;
 const answer=solve(level,1)[0];
 const distance=p=>{const r=p.cells.reduce((n,i)=>n+Math.floor(i/level.cols),0)/p.cells.length,c=p.cells.reduce((n,i)=>n+i%level.cols,0)/p.cells.length;return Math.abs(r-(level.rows-1)/2)+Math.abs(c-(level.cols-1)/2);};
 let central=[...answer].sort((a,b)=>distance(a)-distance(b));
 central=[...central.slice(variant),...central.slice(0,variant)];
 let locked;
 if(mechanics.includes('locked')){
  locked=central.find(p=>p.cells.length>=4&&p.cells.length<=8)||central[0];level.locked=[locked];
 }
 if(mechanics.includes('blocked')){
  const obstacle=central.find(p=>p.id!==locked?.id&&p.cells.length<=6);
  if(!obstacle)return null;
  level.blocked=[...obstacle.cells].sort((a,b)=>a-b);level.apps=level.apps.filter(a=>a.id!==obstacle.id);
 }
 if(mechanics.includes('shape')){
  const p=central.find(p=>p.id!==locked?.id&&level.apps.some(a=>a.id===p.id));
  const h=Math.max(...p.cells.map(i=>Math.floor(i/level.cols)))-Math.min(...p.cells.map(i=>Math.floor(i/level.cols)))+1;
  const w=Math.max(...p.cells.map(i=>i%level.cols))-Math.min(...p.cells.map(i=>i%level.cols))+1;
  level.apps.find(a=>a.id===p.id).shape=w>h?'wide':h>w?'tall':'square';
 }
 const analysis=analyze(level).stats;
 if(analysis.solutions!==1)return null;
 const score=analysis.maxDepth*120+analysis.strongUnresolved*25+analysis.basicUnresolved*8+analysis.initialOptions.reduce((a,b)=>a+b,0)+level.cols*level.rows*.25-analysis.initialSingles*2;
 return {...level,rating:{score,depth:analysis.maxDepth,basic:analysis.basicUnresolved,strong:analysis.strongUnresolved},mechanics};
}
const authored={},used=new Set();
for(const [oldRank,newRank] of Object.entries(legacyRanks)){
 const level={...legacyLevels[oldRank],rank:newRank,name:`Level ${newRank} · ${legacyLevels[oldRank].title}`,campaignVersion:2,chapter:Math.ceil(newRank/10),mechanics:[]};
 const a=analyze(level).stats;level.rating={score:a.maxDepth*120+a.strongUnresolved*25+a.basicUnresolved*8+a.initialOptions.reduce((x,y)=>x+y,0)+level.cols*level.rows*.25-a.initialSingles*2,depth:a.maxDepth,basic:a.basicUnresolved,strong:a.strongUnresolved};
 authored[newRank]=level;used.add(keyOf(level));
}
for(let chapter=1;chapter<=10;chapter++){
 const [chapterName,sourceTier,mechanics]=chapters[chapter-1];
 const bands=[[11,21],[22,33.5],[34,74.75],[75,109.5],[110,259],[260,504],[505,579],[580,699],[700,828],[829,1118]];
 const [minimum,maximum]=bands[chapter-1];
 const candidates=pool.filter(p=>p.difficulty===sourceTier&&(chapter!==7||p.orientation==='landscape'))
  .flatMap(p=>Array.from({length:mechanics.length?(chapter===10?15:6):1},(_,variant)=>addMechanics(p,mechanics,variant))).filter(Boolean)
  .filter(p=>p.rating.score>=minimum&&p.rating.score<=maximum&&(chapter<8||p.rating.depth>=1&&p.rating.strong>=4));
 candidates.sort((a,b)=>a.rating.score-b.rating.score);
 const ranks=Array.from({length:10},(_,i)=>(chapter-1)*10+i+1).filter(rank=>!authored[rank]);
 if(candidates.length<ranks.length)throw Error(`Not enough candidates for chapter ${chapter}: ${candidates.length}`);
 let selected=[];
 // Take a spreading of increasing ratings, then sort the playable chapter.
 for(let k=0;k<ranks.length;k++){
  let index=Math.floor(k*(candidates.length-1)/Math.max(1,ranks.length-1));
  while(index<candidates.length&&used.has(keyOf(candidates[index])))index++;
  if(index===candidates.length)index=candidates.findIndex(p=>!used.has(keyOf(p)));
  if(index<0)throw Error('Duplicate chapter pool');
  const picked=candidates[index];selected.push(picked);used.add(keyOf(picked));
 }
 selected.sort((a,b)=>a.rating.score-b.rating.score);
 for(let k=0;k<ranks.length;k++){
  const rank=ranks[k],level=selected[k];
  Object.assign(level,{id:`campaign-v2-${rank}`,rank,campaignVersion:2,chapter,title:`${chapterName} ${k+1}`,name:`Level ${rank} · ${chapterName}`,difficulty:chapter<=2?'Easy':chapter<=4?'Medium':chapter<=7?'Hard':'Expert'});
  level.lesson=mechanics.length?[
   mechanics.includes('locked')?'Locked widgets stay in place.':null,
   mechanics.includes('blocked')?'Hatched spaces stay empty.':null,
   mechanics.includes('shape')?'Follow the marked app’s shape: ↔ wide, ↕ tall, □ square.':null
  ].filter(Boolean).join(' '):'';
  authored[rank]=level;
 }
 console.log(`Chapter ${chapter}: ${chapterName}, ${candidates.length} verified candidates`);
}
const levels=Object.fromEntries(Object.entries(authored).sort((a,b)=>Number(a[0])-Number(b[0])));
await writeFile(new URL('../src/levels.mjs',import.meta.url),'export const levels='+JSON.stringify(levels,null,2)+';\n');
await writeFile(new URL('../.authoring/campaign-100-ratings.json',import.meta.url),JSON.stringify(Object.values(levels).map(l=>({rank:l.rank,difficulty:l.difficulty,chapter:l.chapter,mechanics:l.mechanics,...l.rating})),null,2));
console.log('Authored 100 campaign levels');
