import {inspect} from './logic.mjs';
import {normalizeSeed} from './generator.mjs';
import {validDay} from './daily.mjs';
const count=value=>Number.isFinite(value)&&value>=0?Math.floor(value):0;
export function decodeProgress(level,data){
 if(!data||!Array.isArray(data.placed)||data.placed.length>level.apps.length)return null;
 const placed=[];
 for(const p of data.placed){if(!p||!Array.isArray(p.cells))return null;const check=inspect(level,p.cells,placed);if(!check.ok||check.id!==p.id)return null;placed.push({id:p.id,cells:[...p.cells]});}
 if(level.locked?.some(lock=>!placed.some(p=>p.id===lock.id)))return null;
 return {placed,hints:count(data.hints),moves:count(data.moves),elapsed:count(data.elapsed),started:!!data.started};
}
export function validBest(record){return record&&['elapsed','moves','hints'].every(key=>Number.isInteger(record[key])&&record[key]>=0);}
export function isBetter(candidate,previous){return !validBest(previous)||candidate.hints<previous.hints||(candidate.hints===previous.hints&&(candidate.elapsed<previous.elapsed||(candidate.elapsed===previous.elapsed&&candidate.moves<previous.moves)));}
export function readEndlessArchive(data){
 if(!Array.isArray(data))return [];
 const result=[],seen=new Set();
 for(const entry of data){
  try{
   if(!entry||normalizeSeed(entry.seed)!==entry.seed||seen.has(entry.seed))continue;
   seen.add(entry.seed);result.push({seed:entry.seed,progress:entry.progress,best:validBest(entry.best)?entry.best:null});
   if(result.length===12)break;
  }catch{}
 }
 return result;
}
export function storeEndlessProgress(archive,seed,progress,best){
 return [{seed:normalizeSeed(seed),progress,best:validBest(best)?best:null},...readEndlessArchive(archive).filter(entry=>entry.seed!==seed)].slice(0,12);
}
export function readDailyArchive(data){
 if(!Array.isArray(data))return [];
 const result=[],seen=new Set();
 for(const entry of data){
  if(!entry||!validDay(entry.day)||seen.has(entry.day))continue;
  seen.add(entry.day);result.push({day:entry.day,progress:entry.progress,best:validBest(entry.best)?entry.best:null});
  if(result.length===32)break;
 }
 return result;
}
export function storeDailyProgress(archive,day,progress,best){
 if(!validDay(day))throw new Error('Invalid daily date');
 return [{day,progress,best:validBest(best)?best:null},...readDailyArchive(archive).filter(entry=>entry.day!==day)].slice(0,32);
}
