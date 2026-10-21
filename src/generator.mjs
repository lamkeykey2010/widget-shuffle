import {solve} from './logic.mjs';
import {analyze} from './analysis.mjs';

// Keep v1 generation stable. Future algorithms must use a new seed prefix.
const seedPattern=/^v1-[a-z0-9][a-z0-9-]{0,39}$/;
export function normalizeSeed(value){
  const seed=String(value??'').trim().toLowerCase();
  if(!seedPattern.test(seed))throw new Error('Use a seed beginning v1- followed by 1 to 40 letters, numbers or hyphens.');
  return seed;
}
export function seededRandom(seed){
  let state=2166136261;
  for(const character of seed){state^=character.charCodeAt(0);state=Math.imul(state,16777619);}
  return ()=>{state+=0x6D2B79F5;let n=state;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
}
const catalogue=[{"id":"weather","name":"Weather","glyph":"☀","detail":"A clear afternoon. 24 degrees.","tone":"sky"},{"id":"calendar","name":"Calendar","glyph":"21","detail":"Coffee at two. Room to think at three.","tone":"rose"},{"id":"music","name":"Music","glyph":"♫","detail":"Slow mornings. A quieter playlist.","tone":"mint"},{"id":"notes","name":"Notes","glyph":"≡","detail":"One small thing at a time.","tone":"butter"},{"id":"photos","name":"Photos","glyph":"▧","detail":"Somewhere you can breathe.","tone":"lilac"},{"id":"activity","name":"Activity","glyph":"◉","detail":"6,240 steps. Small steps count.","tone":"peach"},{"id":"clock","name":"Clock","glyph":"◷","detail":"A little time for yourself.","tone":"sky"},{"id":"books","name":"Books","glyph":"▤","detail":"Chapter seven. Just one more page.","tone":"butter"},{"id":"plants","name":"Plants","glyph":"❧","detail":"Your fern is doing just fine.","tone":"mint"},{"id":"mail","name":"Mail","glyph":"✉","detail":"A postcard from an old friend.","tone":"rose"},{"id":"maps","name":"Maps","glyph":"⌁","detail":"A quiet route through the park.","tone":"lilac"},{"id":"wallet","name":"Wallet","glyph":"▱","detail":"Coffee money for a rainy day.","tone":"peach"},{"id":"tasks","name":"Tasks","glyph":"✓","detail":"Make something. Take a break.","tone":"mint"},{"id":"podcast","name":"Podcasts","glyph":"◌","detail":"Small wonders. Episode twelve.","tone":"sky"},{"id":"recipe","name":"Recipes","glyph":"♧","detail":"Sunday pancakes, any day of the week.","tone":"butter"}];
const introFallback={"id":"first-screen-v1","cols":4,"rows":6,"apps":[{"id":"weather","name":"Weather","glyph":"☀","detail":"A clear afternoon. 24 degrees.","tone":"sky","i":1,"area":4},{"id":"calendar","name":"Calendar","glyph":"21","detail":"Your afternoon is free.","tone":"rose","i":2,"area":6},{"id":"music","name":"Music","glyph":"♫","detail":"Slow mornings. A playlist for a quieter day.","tone":"mint","i":9,"area":4},{"id":"notes","name":"Notes","glyph":"≡","detail":"One small thing at a time.","tone":"butter","i":14,"area":2},{"id":"photos","name":"Photos","glyph":"▧","detail":"A little escape to the hills.","tone":"lilac","i":21,"area":4},{"id":"activity","name":"Activity","glyph":"◉","detail":"6,240 steps. Keep it going.","tone":"peach","i":22,"area":4}],"rank":1,"title":"First Screen","difficulty":"Intro","name":"Level 1 · First Screen","device":"phone","orientation":"portrait"};
const profiles=[
  {difficulty:'Easy',shapes:[[4,5],[4,6]],count:6,minOptions:1,maxSingles:6},
  {difficulty:'Medium',shapes:[[5,6],[5,7]],count:8,minOptions:1.6,maxSingles:5},
  {difficulty:'Hard',shapes:[[6,8],[7,8],[8,6]],count:11,minOptions:2,maxSingles:4},
  {difficulty:'Expert',shapes:[[8,9],[8,10],[10,8]],count:15,minOptions:2.5,maxSingles:3}
];
function shuffled(input,random){const values=[...input];for(let i=values.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;}
function partition(cols,rows,count,random){
  let rectangles=[{r:0,c:0,w:cols,h:rows}];
  while(rectangles.length<count){
    const cuts=[];
    for(let k=0;k<rectangles.length;k++){
      const rect=rectangles[k];
      for(let x=1;x<rect.w;x++)if(x*rect.h>=2&&(rect.w-x)*rect.h>=2)cuts.push({k,a:{...rect,w:x},b:{...rect,c:rect.c+x,w:rect.w-x},weight:rect.w*rect.h});
      for(let y=1;y<rect.h;y++)if(y*rect.w>=2&&(rect.h-y)*rect.w>=2)cuts.push({k,a:{...rect,h:y},b:{...rect,r:rect.r+y,h:rect.h-y},weight:rect.w*rect.h});
    }
    if(!cuts.length)return null;
    let roll=random()*cuts.reduce((n,cut)=>n+cut.weight,0),selected=cuts.at(-1);
    for(const cut of cuts){roll-=cut.weight;if(roll<0){selected=cut;break;}}
    rectangles.splice(selected.k,1,selected.a,selected.b);
  }
  return rectangles;
}
const challengeTemplates={"7":{"cols":6,"rows":8,"rectangles":[{"r":0,"c":4,"h":2,"w":2},{"r":0,"c":0,"h":2,"w":4},{"r":2,"c":1,"h":4,"w":2},{"r":2,"c":0,"h":6,"w":1},{"r":6,"c":1,"h":2,"w":2},{"r":2,"c":5,"h":3,"w":1},{"r":2,"c":4,"h":6,"w":1},{"r":2,"c":3,"h":4,"w":1},{"r":6,"c":3,"h":2,"w":1},{"r":5,"c":5,"h":3,"w":1}]},"10":{"cols":8,"rows":10,"rectangles":[{"r":0,"c":2,"h":2,"w":6},{"r":0,"c":0,"h":3,"w":2},{"r":2,"c":2,"h":1,"w":6},{"r":3,"c":0,"h":4,"w":2},{"r":7,"c":0,"h":1,"w":2},{"r":4,"c":2,"h":1,"w":4},{"r":7,"c":2,"h":1,"w":5},{"r":5,"c":2,"h":1,"w":6},{"r":3,"c":6,"h":2,"w":2},{"r":3,"c":2,"h":1,"w":4},{"r":6,"c":7,"h":4,"w":1},{"r":6,"c":2,"h":1,"w":5},{"r":8,"c":2,"h":2,"w":3},{"r":8,"c":0,"h":2,"w":2},{"r":8,"c":5,"h":2,"w":2}]}};
function challengePartition(profile,cols,rows,random){
  const key=profile.difficulty==='Expert'?'10':'7';
  const template=challengeTemplates[key];
  const transpose=cols===template.rows,flipX=random()<.5,flipY=random()<.5;
  let rectangles=template.rectangles.map(q=>transpose?{r:q.c,c:q.r,w:q.h,h:q.w}:{...q});
  // Recut neighboring rectangles to vary the tiling while retaining full coverage.
  for(let move=0;move<4;move++){
    const choices=[];
    for(let a=0;a<rectangles.length;a++)for(let b=a+1;b<rectangles.length;b++){
      const x=rectangles[a],y=rectangles[b],r=Math.min(x.r,y.r),c=Math.min(x.c,y.c),w=Math.max(x.c+x.w,y.c+y.w)-c,h=Math.max(x.r+x.h,y.r+y.h)-r;
      if(w*h!==x.w*x.h+y.w*y.h)continue;
      for(let v=1;v<w;v++)if(v*h>=2&&(w-v)*h>=2&&Math.max(v*h,(w-v)*h)<=18)choices.push({a,b,x:{r,c,w:v,h},y:{r,c:c+v,w:w-v,h}});
      for(let v=1;v<h;v++)if(v*w>=2&&(h-v)*w>=2&&Math.max(v*w,(h-v)*w)<=18)choices.push({a,b,x:{r,c,w,h:v},y:{r:r+v,c,w,h:h-v}});
    }
    if(choices.length){const choice=choices[Math.floor(random()*choices.length)];rectangles[choice.a]=choice.x;rectangles[choice.b]=choice.y;}
  }
  return rectangles.map(q=>({...q,c:flipX?cols-q.c-q.w:q.c,r:flipY?rows-q.r-q.h:q.r}));
}
export function ambiguity(level){
  const options=level.apps.map(app=>{
    let count=0;
    for(let h=1;h<=level.rows;h++)if(app.area%h===0){const w=app.area/h;if(w>level.cols)continue;
      for(let r=Math.max(0,Math.floor(app.i/level.cols)-h+1);r<=Math.min(Math.floor(app.i/level.cols),level.rows-h);r++)
        for(let c=Math.max(0,app.i%level.cols-w+1);c<=Math.min(app.i%level.cols,level.cols-w);c++)
          if(level.apps.every(other=>other===app||Math.floor(other.i/level.cols)<r||Math.floor(other.i/level.cols)>=r+h||other.i%level.cols<c||other.i%level.cols>=c+w))count++;
    }return count;
  });
  return {average:options.reduce((a,b)=>a+b,0)/options.length,singles:options.filter(n=>n===1).length};
}
function makeCandidate(seed,profile,cols,rows,random){
  const rectangles=profile.difficulty==='Expert'||profile.difficulty==='Hard'?challengePartition(profile,cols,rows,random):partition(cols,rows,profile.count,random);if(!rectangles)return null;
  if(rectangles.some(rect=>rect.w*rect.h>18))return null;
  const apps=shuffled(catalogue,random).slice(0,rectangles.length).map((app,k)=>{
    const rect=rectangles[k];return {...app,i:(rect.r+Math.floor(random()*rect.h))*cols+rect.c+Math.floor(random()*rect.w),area:rect.w*rect.h};
  });
  return {id:`endless-${seed}`,seed,cols,rows,apps,title:'A fresh arrangement',name:`Endless · ${seed}`,difficulty:profile.difficulty,device:cols>=6?'tablet':'phone',orientation:cols>rows?'landscape':'portrait'};
}
export function* generatePuzzle(seedInput){
  const seed=normalizeSeed(seedInput),random=seededRandom(seed),profile=profiles[Math.floor(random()*profiles.length)];
  let [cols,rows]=profile.shapes[Math.floor(random()*profile.shapes.length)];
  if(profile.difficulty==='Hard')[cols,rows]=random()<.5?[6,8]:[8,6];
  if(profile.difficulty==='Expert')[cols,rows]=random()<.5?[8,10]:[10,8];
  let firstUnique=null;
  for(let attempt=0;attempt<600;attempt++){
    const candidate=makeCandidate(seed,profile,cols,rows,random);
    if(candidate){
      try{
        const solutions=solve(candidate,2,12000);
        if(solutions.length===1){
          firstUnique??=candidate;
          const score=ambiguity(candidate);
          if(score.average>=profile.minOptions&&score.singles<=profile.maxSingles){
            if(profile.difficulty==='Expert'||profile.difficulty==='Hard'){
              const rating=analyze(candidate,1500).stats;
              if(profile.difficulty==='Expert'?(rating.strongUnresolved>=4&&rating.maxDepth>=1):rating.basicUnresolved>=3)return candidate;
            }else return candidate;
          }
        }
      }catch(error){if(!['Solver budget exceeded','Node limit'].includes(error.message))throw error;}
    }
    yield attempt;
  }
  // A verified candidate always beats relaxing the uniqueness requirement.
  if(firstUnique)return {...firstUnique,difficulty:['Expert','Hard'].includes(profile.difficulty)?'Medium':'Easy'};
  // Bounded deterministic safety net, retaining the seed and unique clue placement.
  const fallback=introFallback,flip=random()<.5;
  return {...fallback,id:`endless-${seed}`,seed,rank:undefined,title:'A fresh arrangement',name:`Endless · ${seed}`,difficulty:'Easy',apps:shuffled(fallback.apps,random).map(app=>({...app,i:flip?fallback.cols*fallback.rows-1-app.i:app.i}))};
}
export function puzzleFromSeed(seed){const iterator=generatePuzzle(seed);let step;do{step=iterator.next();}while(!step.done);return step.value;}
export function routeFromHash(hash){
  const params=new URLSearchParams(String(hash).replace(/^#/,''));
  if(params.has('seed'))return {seed:normalizeSeed(params.get('seed'))};
  return {rank:/^(?:[1-9]|10)$/.test(params.get('level')||'')?params.get('level'):'1'};
}
export function puzzleHash(puzzle){return puzzle.seed?`#seed=${normalizeSeed(puzzle.seed)}`:`#level=${puzzle.rank}`;}
