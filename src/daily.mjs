import {generatePuzzle,seededRandom} from './generator.mjs';
import {analyze} from './analysis.mjs';
import {legacyLevels} from './legacy.mjs';

export function validDay(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(`${value}T00:00:00Z`);
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function hongKongDay(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Asia/Hong_Kong',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
function dailyIdentity(base,day){
 const result={...base,id:`daily-v1-${day}`,daily:day,dailyVersion:1,difficulty:'Expert',title:'The daily arrangement',name:`Daily Expert · ${day}`};
 delete result.seed;delete result.rank;return result;
}
// Daily v1 is date-based, deterministic, and never downgrades below Expert.
export function* generateDaily(day){
 if(!validDay(day))throw new Error('Use a valid daily challenge date in YYYY-MM-DD format.');
 for(let attempt=0;attempt<48;attempt++){
  const iterator=generatePuzzle(`v1-daily-${day}-${attempt}`);let step;
  do{step=iterator.next();if(!step.done)yield null;}while(!step.done);
  if(step.value.difficulty==='Expert'){
   const rating=analyze(step.value).stats;
   if(rating.maxDepth>=2&&rating.strongUnresolved>=4)return dailyIdentity(step.value,day);
  }
  yield null;
 }
 // A geometric reflection of the original Expert is a guaranteed Expert fallback.
 const base=legacyLevels['10'],random=seededRandom(`daily-v1-${day}`),flipX=random()<.5,flipY=random()<.5;
 return dailyIdentity({...base,apps:base.apps.map(app=>({...app,i:(flipY?base.rows-1-Math.floor(app.i/base.cols):Math.floor(app.i/base.cols))*base.cols+(flipX?base.cols-1-app.i%base.cols:app.i%base.cols)}))},day);
}
export function dailyPuzzle(day){const iterator=generateDaily(day);let step;do{step=iterator.next();}while(!step.done);return step.value;}
