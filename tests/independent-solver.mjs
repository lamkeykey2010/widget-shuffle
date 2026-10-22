export function independentlySolve(level){
 const choices=[];
 for(let top=0;top<level.rows;top++)for(let left=0;left<level.cols;left++)for(let bottom=top;bottom<level.rows;bottom++)for(let right=left;right<level.cols;right++){
  const area=(bottom-top+1)*(right-left+1);if(!level.apps.some(a=>a.area===area))continue;
  const apps=level.apps.filter(a=>Math.floor(a.i/level.cols)>=top&&Math.floor(a.i/level.cols)<=bottom&&a.i%level.cols>=left&&a.i%level.cols<=right);
  if(apps.length!==1||apps[0].area!==area)continue;
  const cells=[];for(let r=top;r<=bottom;r++)for(let c=left;c<=right;c++)cells.push(r*level.cols+c);
  if(cells.some(i=>level.blocked?.includes(i)))continue;
  const app=apps[0],w=right-left+1,h=bottom-top+1;
  if(app.shape==='wide'&&w<=h||app.shape==='tall'&&h<=w||app.shape==='square'&&w!==h)continue;
  const lock=level.locked?.find(p=>p.id===app.id);
  if(lock&&(lock.cells.length!==cells.length||!cells.every(i=>lock.cells.includes(i))))continue;
  choices.push({id:apps[0].id,cells});
 }
 const answers=[];let nodes=0;
 function visit(used,apps,placed){
  if(answers.length>=2)return;if(++nodes>1000000)throw Error('Verifier budget exceeded');
  if(used.size===level.cols*level.rows){answers.push(placed);return;}
  let best;
  for(let i=0;i<level.cols*level.rows;i++)if(!used.has(i)){const options=choices.filter(p=>p.cells.includes(i)&&!apps.has(p.id)&&!p.cells.some(c=>used.has(c)));if(!options.length)return;if(!best||options.length<best.length)best=options;}
  for(const p of best)visit(new Set([...used,...p.cells]),new Set([...apps,p.id]),[...placed,p]);
 }
 visit(new Set(level.blocked||[]),new Set(),[]);return answers;
}
