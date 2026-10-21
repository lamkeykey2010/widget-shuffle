import {inspect} from './logic.mjs';
const count=value=>Number.isFinite(value)&&value>=0?Math.floor(value):0;
export function decodeProgress(level,data){
 if(!data||!Array.isArray(data.placed)||data.placed.length>level.apps.length)return null;
 const placed=[];
 for(const p of data.placed){if(!p||!Array.isArray(p.cells))return null;const check=inspect(level,p.cells,placed);if(!check.ok||check.id!==p.id)return null;placed.push({id:p.id,cells:[...p.cells]});}
 return {placed,hints:count(data.hints),moves:count(data.moves),elapsed:count(data.elapsed),started:!!data.started};
}
export function validBest(record){return record&&['elapsed','moves','hints'].every(key=>Number.isInteger(record[key])&&record[key]>=0);}
export function isBetter(candidate,previous){return !validBest(previous)||candidate.hints<previous.hints||(candidate.hints===previous.hints&&(candidate.elapsed<previous.elapsed||(candidate.elapsed===previous.elapsed&&candidate.moves<previous.moves)));}
