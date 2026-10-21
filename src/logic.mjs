export const cellsFor=(cols,a,b)=>{
  const top=Math.min(Math.floor(a/cols),Math.floor(b/cols)),bottom=Math.max(Math.floor(a/cols),Math.floor(b/cols));
  const left=Math.min(a%cols,b%cols),right=Math.max(a%cols,b%cols);
  return Array.from({length:(bottom-top+1)*(right-left+1)},(_,i)=>(top+Math.floor(i/(right-left+1)))*cols+left+i%(right-left+1));
};
export function inspect(level,cells,placed=[]){
  if(!cells.length||new Set(cells).size!==cells.length||!cells.every(i=>Number.isInteger(i)&&i>=0&&i<level.cols*level.rows))return {ok:false,message:'Keep your widget inside the screen.'};
  const rs=cells.map(i=>Math.floor(i/level.cols)),cs=cells.map(i=>i%level.cols);
  if((Math.max(...rs)-Math.min(...rs)+1)*(Math.max(...cs)-Math.min(...cs)+1)!==cells.length)return {ok:false,message:'Widgets need a complete rectangle.'};
  const apps=level.apps.filter(app=>cells.includes(app.i));
  if(apps.length!==1)return {ok:false,message:apps.length?'Give each app its own widget.':'Include an app icon in your rectangle.'};
  const app=apps[0];
  if(cells.length!==app.area)return {ok:false,message:`${app.name} needs ${app.area} spaces. You selected ${cells.length}.`};
  if(placed.some(p=>p.cells.some(i=>cells.includes(i))))return {ok:false,message:'That overlaps another widget. Resize it first.'};
  return {ok:true,id:app.id,message:`${app.name} expanded. ${app.detail}`};
}
export function finished(level,placed){
  const all=placed.flatMap(p=>p.cells);
  return all.length===level.cols*level.rows&&new Set(all).size===all.length&&placed.length===level.apps.length&&placed.every((p,k)=>{const v=inspect(level,p.cells,placed.filter((_,j)=>j!==k));return v.ok&&v.id===p.id;});
}
export function solve(level,limit=2){
  const choices=level.apps.map(app=>{
    const out=[];
    for(let h=1;h<=level.rows;h++)if(app.area%h===0){const w=app.area/h;if(w>level.cols)continue;
      for(let r=0;r+h<=level.rows;r++)for(let c=0;c+w<=level.cols;c++){
        const cells=cellsFor(level.cols,r*level.cols+c,(r+h-1)*level.cols+c+w-1);
        if(cells.includes(app.i)&&level.apps.filter(a=>cells.includes(a.i)).length===1)out.push({id:app.id,cells});
      }
    }return out;
  });
  const solutions=[];
  function visit(remaining,used,placed){
    if(solutions.length>=limit)return;
    if(!remaining.length){if(used.size===level.cols*level.rows)solutions.push(placed);return;}
    let best;
    for(const k of remaining){const options=choices[k].filter(p=>!p.cells.some(i=>used.has(i)));if(!options.length)return;if(!best||options.length<best.options.length)best={k,options};}
    for(const p of best.options)visit(remaining.filter(k=>k!==best.k),new Set([...used,...p.cells]),[...placed,p]);
  }
  visit(choices.map((_,i)=>i),new Set(),[]);return solutions;
}
