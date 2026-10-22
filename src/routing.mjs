import {normalizeSeed} from './generator.mjs';
import {validDay,hongKongDay} from './daily.mjs';
import {legacyRanks} from './legacy.mjs';

export const campaignChapters=['First steps','Finding your flow','Stay in place','Make some space','A different shape','Around the dock','Turn the screen','Think ahead','Everything connects','One last arrangement'];
export function readRoute(hash,now=new Date()){
 const params=new URLSearchParams(String(hash).replace(/^#/,''));
 if(params.has('daily')){
  if(params.has('dv')&&params.get('dv')!=='1')throw new Error('This daily challenge version is not supported.');
  const day=params.get('daily')==='today'?hongKongDay(now):params.get('daily');
  if(!validDay(day))throw new Error('That daily challenge date is not valid.');
  return {daily:day};
 }
 if(params.has('seed'))return {seed:normalizeSeed(params.get('seed'))};
 const rank=params.get('level')||'1';
 if(!/^(?:[1-9]|[1-9][0-9]|100)$/.test(rank))return {rank:'1'};
 if(params.has('campaign')&&params.get('campaign')!=='2')throw new Error('This campaign version is not supported.');
 return {rank:String(params.get('campaign')==='2'?Number(rank):(legacyRanks[rank]||Number(rank)))};
}
export function shareHash(puzzle){
 if(puzzle.daily)return `#daily=${puzzle.daily}&dv=1`;
 if(puzzle.seed)return `#seed=${normalizeSeed(puzzle.seed)}`;
 return `#campaign=2&level=${puzzle.rank}`;
}
