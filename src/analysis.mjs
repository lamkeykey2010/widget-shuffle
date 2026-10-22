import {cellsFor,inspect} from './logic.mjs';
export function domainsFor(level){return level.apps.map(app=>{
 const options=[];
 for(let h=1;h<=level.rows;h++)if(app.area%h===0){const w=app.area/h;if(w>level.cols)continue;
  for(let r=0;r+h<=level.rows;r++)for(let c=0;c+w<=level.cols;c++){
   const cells=cellsFor(level.cols,r*level.cols+c,(r+h-1)*level.cols+c+w-1);
   if(cells.includes(app.i)&&level.apps.filter(a=>cells.includes(a.i)).length===1&&inspect(level,cells).ok)options.push({id:app.id,cells,mask:cells.reduce((mask,i)=>mask|(1n<<BigInt(i)),0n)});
  }
 }return options;
});}
export function propagate(input,total,strong=false,metrics={},blocked=[]){
 const domains=input.map(list=>[...list]);let changed=true;
 while(changed){changed=false;metrics.rounds=(metrics.rounds||0)+1;
  if(domains.some(d=>!d.length))return null;
  for(let a=0;a<domains.length;a++){
   if(domains[a].length!==1)continue;
   const fixed=domains[a][0];
   for(let b=0;b<domains.length;b++)if(a!==b){const next=domains[b].filter(p=>!(p.mask&fixed.mask));if(!next.length)return null;if(next.length!==domains[b].length){domains[b]=next;changed=true;}}
  }
  for(let cell=0;cell<total;cell++){
   if(blocked.includes(cell))continue;
   const bit=1n<<BigInt(cell),owners=[];
   for(let a=0;a<domains.length;a++)if(domains[a].some(p=>p.mask&bit))owners.push(a);
   if(!owners.length)return null;
   if(owners.length===1){const a=owners[0],next=domains[a].filter(p=>p.mask&bit);if(next.length!==domains[a].length){domains[a]=next;changed=true;}}
  }
  if(strong)for(let a=0;a<domains.length;a++)if(domains[a].length>1){
   const next=domains[a].filter(p=>domains.every((other,b)=>a===b||other.some(q=>!(p.mask&q.mask))));
   if(!next.length)return null;if(next.length!==domains[a].length){domains[a]=next;changed=true;}
  }
 }
 return domains;
}
export function analyze(level,nodeLimit=30000){
 const initial=domainsFor(level),total=level.cols*level.rows;
 const blocked=level.blocked||[];
 const basicMetrics={},basic=propagate(initial,total,false,basicMetrics,blocked),strongMetrics={},strong=propagate(initial,total,true,strongMetrics,blocked);
 const stats={initialOptions:initial.map(d=>d.length),initialSingles:initial.filter(d=>d.length===1).length,basicUnresolved:basic?.filter(d=>d.length>1).length??-1,basicRounds:basicMetrics.rounds,strongUnresolved:strong?.filter(d=>d.length>1).length??-1,nodes:0,contradictions:0,maxDepth:0,solutions:0};
 const answers=[];
 function visit(input,depth){
  if(++stats.nodes>nodeLimit)throw Error('Node limit');stats.maxDepth=Math.max(stats.maxDepth,depth);
  const domains=propagate(input,total,true,{},blocked);
  if(!domains){stats.contradictions++;return;}
  const unresolved=domains.map((d,k)=>({k,d})).filter(v=>v.d.length>1).sort((a,b)=>a.d.length-b.d.length);
  if(!unresolved.length){answers.push(domains.map(d=>({id:d[0].id,cells:d[0].cells})));return;}
  const {k,d}=unresolved[0];for(const p of d){const next=domains.map(v=>[...v]);next[k]=[p];visit(next,depth+1);if(answers.length>=2)return;}
 }
 visit(initial,0);stats.solutions=answers.length;return {stats,solution:answers[0]};
}
