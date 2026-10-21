import {cellsFor,inspect,finished,solve} from './logic.mjs';
import {levels} from './levels.mjs';
import {decodeProgress,validBest,isBetter,readEndlessArchive,storeEndlessProgress} from './state.mjs';
import {normalizeSeed,generatePuzzle,routeFromHash,puzzleHash} from './generator.mjs';
const $=id=>document.getElementById(id),board=$('board');
let initialRoute={rank:'1'},initialError='';
let savedMode='1';try{savedMode=localStorage.getItem('widget-shuffle-active')||'1';}catch{}
try{initialRoute=routeFromHash(location.hash||(savedMode.startsWith('seed=')?savedMode:`level=${savedMode}`));}catch(error){initialError=error.message;}
let activeMode='1',level=levels['1'],storageKey='widget-shuffle-'+level.id,lastCampaignRank='1',generating=false,lastEndlessSeed=null;
let placed=[],history=[],hints=0,moves=0,elapsed=0,started=false,resize=false,corner=null,drag=null,selection=null,lastApp=null,inspectingId=null;
let solution=solve(level,1)[0];
const sessions=new Map();
const appById=id=>level.apps.find(a=>a.id===id);
const clone=value=>JSON.parse(JSON.stringify(value));
const bestScores={};
try{const saved=JSON.parse(localStorage.getItem('widget-shuffle-best-v1'));for(const rank of Object.keys(levels))if(validBest(saved?.[rank]))bestScores[rank]=saved[rank];}catch{}
let endlessArchive=[];
try{endlessArchive=readEndlessArchive(JSON.parse(localStorage.getItem('widget-shuffle-endless-v1')));lastEndlessSeed=endlessArchive[0]?.seed||null;}catch{}
const currentBest=()=>level.seed?endlessArchive.find(entry=>entry.seed===level.seed)?.best:bestScores[activeMode];
function save(){
 let best=currentBest();
 if(finished(level,placed)){const candidate={hints,moves,elapsed};if(isBetter(candidate,best))best=candidate;}
 const progress={placed,hints,moves,elapsed,started};
 if(level.seed)endlessArchive=storeEndlessProgress(endlessArchive,level.seed,clone(progress),best);
 else if(best)bestScores[activeMode]=best;
 try{
  if(level.seed)localStorage.setItem('widget-shuffle-endless-v1',JSON.stringify(endlessArchive));
  else{localStorage.setItem(storageKey,JSON.stringify(progress));localStorage.setItem('widget-shuffle-best-v1',JSON.stringify(bestScores));}
  localStorage.setItem('widget-shuffle-active',level.seed?`seed=${level.seed}`:activeMode);
 }catch{}
}
function restore(){
  placed=[];history=[];hints=0;moves=0;elapsed=0;started=false;lastApp=null;
  const session=sessions.get(activeMode);if(session){({placed,history,hints,moves,elapsed,started,lastApp}=clone(session));return;}
  try{const raw=level.seed?endlessArchive.find(entry=>entry.seed===level.seed)?.progress:JSON.parse(localStorage.getItem(storageKey));const data=decodeProgress(level,raw);if(data){({placed,hints,moves,elapsed,started}=data);lastApp=placed.at(-1)?.id||null;}}catch{placed=[];}
}
const formatTime=seconds=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
function message(text,error=false){$('feedback').textContent=text;$('feedback').classList.toggle('error',error);}
function checkpoint(kind='edit'){history.push(clone({kind,placed,hints,moves,elapsed,started,lastApp}));if(history.length>80)history.shift();}
function bounds(cells){const rs=cells.map(i=>Math.floor(i/level.cols)),cs=cells.map(i=>i%level.cols);return {r:Math.min(...rs),c:Math.min(...cs),h:Math.max(...rs)-Math.min(...rs)+1,w:Math.max(...cs)-Math.min(...cs)+1};}
function position(element,cells){const b=bounds(cells);element.style.left=`calc(${b.c/level.cols*100}% + 1px)`;element.style.top=`calc(${b.r/level.rows*100}% + 1px)`;element.style.width=`calc(${b.w/level.cols*100}% - 2px)`;element.style.height=`calc(${b.h/level.rows*100}% - 2px)`;return b;}
function widgetBody(app,compact,narrow=false){
  if(compact)return `<span>${{weather:'24° · Clear skies',calendar:'21 · A quiet afternoon',music:'Slow mornings ♫',notes:'One small thing at a time.',photos:'A little escape to the hills.',activity:'6,240 steps today',clock:'09:41 · Your time',books:'Chapter seven',plants:'Fern · Doing just fine',mail:'A postcard for you',maps:'A walk through the park',wallet:'Coffee fund · $84',tasks:'Make. Rest. Repeat.',podcast:'Small wonders · Ep. 12',recipe:'Sunday pancakes',travel:'Somewhere new'}[app.id]||app.detail}</span>`;
  if(narrow)return {weather:'<span class="big-number">24°</span><span class="widget-copy">Clear skies.<br>Step outside.</span>',calendar:'<span class="calendar-day">WED</span><span class="big-number">21</span><span class="widget-copy">14:00<br>Coffee break.</span>',music:'<div class="music-art"></div><span class="widget-title">Slow mornings</span><span class="widget-copy">A quieter playlist.</span>',notes:'<span class="widget-copy">One small thing at a time.</span>',photos:'<div class="photo-landscape"></div><span class="photo-caption">A little escape.</span>',activity:'<span class="big-number">6,240</span><span class="widget-copy">Steps today.<br>Keep going.</span>'}[app.id]||`<span class="widget-symbol">${app.glyph}</span><span class="widget-copy">${app.detail}</span>`;
  return {weather:'<div class="weather-line"><span class="big-number">24°</span><span class="sun">☀</span></div><div class="widget-copy">Clear skies<br>A good day to step outside.</div>',calendar:'<span class="calendar-day">WEDNESDAY</span><span class="calendar-date">21</span><div class="calendar-event">14:00 · Coffee break<br>After that? A little room.</div>',music:'<div class="music-art"></div><span class="widget-title">Slow mornings</span><span class="widget-copy">A quieter kind of playlist.</span><span class="music-controls">‹ ▷ ›</span>',photos:'<div class="photo-landscape"></div><span class="photo-caption">Somewhere you can breathe.</span>',activity:'<div class="activity-row"><span class="activity-rings"></span><span class="big-number">6,240</span></div><div class="widget-copy">Steps today<br>Small steps still count.</div>',notes:'<span class="widget-title">A little reminder</span><span class="widget-copy">One small thing at a time.</span>',clock:'<span class="big-number">09:41</span><span class="widget-copy">A little time for yourself.</span>',books:'<div class="book-cover">THE<br>QUIET<br>HOURS</div><span class="widget-copy">Chapter seven · 42% read</span>',plants:'<span class="widget-symbol">❧</span><span class="widget-title">Hello, little fern.</span><span class="widget-copy">Water in two days.</span>',mail:'<span class="widget-symbol">✉</span><span class="widget-title">Wish you were here.</span><span class="widget-copy">A postcard from an old friend.</span>',maps:'<div class="map-art"></div><span class="widget-copy">The quiet route · 18 min</span>',wallet:'<span class="widget-copy">YOUR COFFEE FUND</span><span class="big-number">$84</span><span class="widget-copy">For a rainy afternoon.</span>',tasks:'<span class="widget-copy">✓ Make something<br>○ Take a break<br>○ Step outside</span>',podcast:'<div class="music-art"></div><span class="widget-title">Small wonders</span><span class="widget-copy">Episode 12 · 28 min</span>',recipe:'<span class="widget-symbol">♧</span><span class="widget-title">Sunday pancakes</span><span class="widget-copy">A slow start to any day.</span>',travel:'<span class="widget-symbol">✈</span><span class="widget-title">Somewhere new.</span><span class="widget-copy">A little adventure awaits.</span>'}[app.id]||`<span class="widget-copy">${app.detail}</span>`;
}
function smallWidget(app,narrow){
  const value={weather:'24°',calendar:'21',music:'♫',notes:narrow?'1 thing':'One thing at a time',activity:narrow?'6k':'6,240 steps',clock:'9:41',books:'Ch. 7',plants:'Fern',mail:'1 new',maps:narrow?'18m':'18 min',wallet:'$84',tasks:'2 left',podcast:'Ep. 12',recipe:narrow?'20m':'20 min',travel:'Next stop'}[app.id];
  return app.id==='photos'?'<div class="photo-landscape"></div>':`<span>${value||app.glyph}</span>`;
}
function adaptWidgets(){
  for(const widget of board.querySelectorAll('.widget')){
    widget.classList.remove('reduced-detail');
    const content=widget.querySelector('.widget-content'),body=widget.querySelector('.widget-body');
    const overflow=content.scrollWidth>content.clientWidth+1||content.scrollHeight>content.clientHeight+1||(getComputedStyle(body).display!=='none'&&(body.scrollWidth>body.clientWidth+1||body.scrollHeight>body.clientHeight+1));
    widget.classList.toggle('reduced-detail',overflow);
  }
}
function render(newId=null){
  const focusIndex=document.activeElement?.dataset?.cell,focusShrink=document.activeElement?.dataset?.shrink;board.replaceChildren();
  for(let i=0;i<level.cols*level.rows;i++){
    const cell=document.createElement('button');cell.type='button';cell.className='cell';cell.dataset.cell=i;
    const app=level.apps.find(a=>a.i===i),owner=placed.find(p=>p.cells.includes(i));
    cell.setAttribute('aria-label',`Row ${Math.floor(i/level.cols)+1}, column ${i%level.cols+1}${app?`, ${app.name}, ${app.area} spaces`:''}${owner?`, inside ${appById(owner.id).name} widget`:''}${owner&&app?`, ${app.detail}`:''}`);
    if(owner)cell.classList.add('covered');
    else if(app){cell.innerHTML=`<span class="app-seed"><span class="app-icon ${app.tone}">${app.glyph}<span class="area-badge">${app.area}</span></span><span class="app-name">${app.name}</span></span>`;}
    if(corner===i)cell.classList.add('corner');board.append(cell);
  }
  for(const p of placed){const app=appById(p.id),element=document.createElement('div');element.className=`widget ${app.tone}${p.id===newId?' bloom':''}${p.id===inspectingId?' inspecting':''}`;element.dataset.app=p.id;element.setAttribute('role','group');element.setAttribute('aria-label',`${app.name} widget`);const b=position(element,p.cells);const compact=b.h===1||(level.cols>=6&&b.h<=2&&b.w<=2);element.dataset.height=b.h;if(compact)element.classList.add('compact');if(b.w===1)element.classList.add('narrow');element.style.transformOrigin=`${((app.i%level.cols-b.c+.5)/b.w)*100}% ${((Math.floor(app.i/level.cols)-b.r+.5)/b.h)*100}%`;element.innerHTML=`<div class="widget-content" aria-hidden="true"><div class="widget-top"><span>${app.name}</span><span class="widget-area">${app.area}</span></div><div class="widget-body">${widgetBody(app,compact,b.w===1)}</div><div class="widget-mobile">${smallWidget(app,b.w===1)}</div></div><button type="button" class="widget-shrink" data-shrink="${app.id}" aria-label="Shrink ${app.name} back to its app icon">↙ <span>Shrink</span></button>`;board.append(element);}
  if(selection){const cells=cellsFor(level.cols,selection[0],selection[1]),valid=inspect(level,cells,placed);const overlay=document.createElement('div');overlay.className='selection'+(valid.ok?'':' invalid');position(overlay,cells);overlay.innerHTML=`<span>${cells.length} ${cells.length===1?'space':'spaces'}</span>`;board.append(overlay);}
  const done=finished(level,placed),area=placed.reduce((n,p)=>n+p.cells.length,0);
  $('progress').textContent=`${placed.length} of ${level.apps.length} apps expanded`;$('progress-fill').style.width=`${area/(level.cols*level.rows)*100}%`;$('timer').textContent=formatTime(elapsed);
  $('undo').disabled=!history.length;$('resize').disabled=!placed.length;$('resize').setAttribute('aria-pressed',String(resize));$('hint').disabled=done;
  $('screen-status').textContent=done?'Everything in its place.':resize?'Choose a widget to shrink.':`${level.cols*level.rows-area} spaces waiting to unfold.`;
  $('completion').hidden=!done;if(done)$('result').textContent=`${level.name} · ${formatTime(elapsed)} · ${moves} moves · ${hints} ${hints===1?'hint':'hints'}`;
  document.querySelectorAll('[data-level]').forEach(button=>{const rank=button.dataset.level,completed=!!bestScores[rank];button.setAttribute('aria-pressed',String(rank===activeMode));button.classList.toggle('completed',completed);button.querySelector('.level-mark').textContent=completed?'✓':'';button.setAttribute('aria-label',`Level ${rank}, ${levels[rank].title}, ${levels[rank].difficulty}${completed?', completed':''}`);});
  const completedCount=Object.keys(bestScores).length;$('campaign-count').textContent=`${completedCount} / 10 complete`;
  $('completion-heading').textContent=!level.seed&&completedCount===10?'All ten. All in their place.':'Everything in its place.';
  $('previous-level').disabled=level.rank===1;$('next-level').disabled=!level.seed&&level.rank===10;$('level-title').textContent=level.title;
  $('next-level').textContent=level.seed?'Next puzzle →':'Next level →';
  $('continue-level').textContent=level.seed?'Next puzzle →':level.rank===10?'Back to the first screen':'Next screen →';
  const best=currentBest();$('best-result').textContent=best?`Best on this device: ${formatTime(best.elapsed)} with ${best.hints} ${best.hints===1?'hint':'hints'}.`:'';
  const savedCompletions=endlessArchive.filter(entry=>entry.best).length;
  $('endless-count').textContent=`${savedCompletions} saved ${savedCompletions===1?'completion':'completions'}`;
  if(lastApp){const app=appById(lastApp);$('discovery-icon').textContent=app.glyph;$('discovery-icon').className='discovery-icon '+app.tone;$('discovery-label').textContent=app.name.toUpperCase()+' · UNFOLDED';$('discovery-text').textContent=app.detail;}
  else{$('discovery-icon').textContent='✦';$('discovery-icon').className='discovery-icon';$('discovery-label').textContent='WAITING TO UNFOLD';$('discovery-text').textContent='Every app has a little more to show you.';}
  if(focusIndex!==undefined)board.querySelector(`[data-cell="${focusIndex}"]`)?.focus({preventScroll:true});
  else if(focusShrink)board.querySelector(`[data-shrink="${focusShrink}"]`)?.focus({preventScroll:true});
  adaptWidgets();
}
function commit(a,b){const cells=cellsFor(level.cols,a,b),v=inspect(level,cells,placed);corner=null;selection=null;inspectingId=null;if(!v.ok){render();message(v.message,true);return;}checkpoint();placed.push({id:v.id,cells});moves++;started=true;lastApp=v.id;resize=false;save();render(v.id);message(finished(level,placed)?'You made room for everything. Your screen is complete.':v.message);}
function shrink(i){const p=placed.find(p=>p.cells.includes(i));if(!p){message('Select an expanded widget to return it to an app icon.');return;}checkpoint();placed=placed.filter(v=>v!==p);moves++;started=true;corner=null;selection=null;resize=false;lastApp=null;inspectingId=null;save();render();board.querySelector(`[data-cell="${appById(p.id).i}"]`)?.focus({preventScroll:true});message(`${appById(p.id).name} returned to its app icon. Undo can bring its widget back.`);}
function tap(i){if(resize){shrink(i);return;}if(corner===null){const owner=placed.find(p=>p.cells.includes(i));if(owner){lastApp=owner.id;inspectingId=inspectingId===owner.id?null:owner.id;render();message(`Select Shrink to return ${appById(owner.id).name} to its icon.`);return;}inspectingId=null;corner=i;selection=null;started=true;render();message('Now select the opposite corner of your widget.');}else commit(corner,i);}
function hit(event){const r=board.getBoundingClientRect();if(event.clientX<r.left||event.clientX>=r.right||event.clientY<r.top||event.clientY>=r.bottom)return null;return Math.min(level.rows-1,Math.floor((event.clientY-r.top)/r.height*level.rows))*level.cols+Math.min(level.cols-1,Math.floor((event.clientX-r.left)/r.width*level.cols));}
board.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('[data-shrink]'))return;const i=hit(e);if(i===null)return;e.preventDefault();if(resize){shrink(i);return;}board.setPointerCapture(e.pointerId);drag={first:i,last:i,moved:false,x:e.clientX,y:e.clientY,pointer:e.pointerId};started=true;});
board.addEventListener('pointermove',e=>{if(!drag)return;const i=hit(e);if(i===null)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7||i!==drag.first)drag.moved=true;drag.last=i;if(drag.moved){selection=[drag.first,i];render();}});
board.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;if(board.hasPointerCapture(e.pointerId))board.releasePointerCapture(e.pointerId);if(hit(e)===null){corner=null;selection=null;render();message('Selection cancelled. Keep both corners inside the screen.');return;}if(d.moved)commit(d.first,d.last);else tap(d.first);});
board.addEventListener('pointercancel',()=>{drag=null;selection=null;corner=null;render();message('Selection cancelled.');});
board.addEventListener('click',e=>{const button=e.target.closest('[data-shrink]');if(button){const p=placed.find(p=>p.id===button.dataset.shrink);if(p)shrink(p.cells[0]);return;}if(e.detail===0){const cell=e.target.closest('[data-cell]');if(cell)tap(Number(cell.dataset.cell));}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('help').open&&!$('share-fallback').open){corner=null;selection=null;resize=false;drag=null;inspectingId=null;render();}});
board.addEventListener('keydown',e=>{const i=Number(e.target.dataset.cell);if(!Number.isInteger(i))return;if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();shrink(i);return;}const row=Math.floor(i/level.cols),col=i%level.cols;let next=i;if(e.key==='ArrowRight'&&col<level.cols-1)next++;else if(e.key==='ArrowLeft'&&col>0)next--;else if(e.key==='ArrowDown'&&row<level.rows-1)next+=level.cols;else if(e.key==='ArrowUp'&&row>0)next-=level.cols;else return;e.preventDefault();board.querySelector(`[data-cell="${next}"]`)?.focus();});
$('undo').addEventListener('click',()=>{const previous=history.pop();if(!previous)return;if(previous.kind==='reset')({placed,hints,moves,elapsed,started,lastApp}=previous);else{placed=previous.placed;lastApp=previous.lastApp;moves++;started=true;}corner=null;selection=null;resize=false;inspectingId=null;save();render();message('One step back. A little more room to think.');});
$('resize').addEventListener('click',()=>{resize=!resize;corner=null;selection=null;render();message(resize?'Select the widget you want to shrink back to an icon.':'Resize cancelled.');});
$('reset').addEventListener('click',()=>{checkpoint('reset');placed=[];hints=0;moves=0;elapsed=0;started=false;corner=null;selection=null;resize=false;lastApp=null;inspectingId=null;save();render();message('A fresh screen. Undo can bring your layout back. Completed-screen records are kept.');});
$('hint').addEventListener('click',()=>{checkpoint();const same=(a,b)=>a.length===b.length&&a.every(i=>b.includes(i));const wrong=placed.find(p=>!solution.some(s=>s.id===p.id&&same(s.cells,p.cells)));hints++;moves++;started=true;corner=null;selection=null;resize=false;
  if(wrong){placed=placed.filter(p=>p!==wrong);lastApp=null;message(`${appById(wrong.id).name} has the right size, but blocks the finished layout. Try a different shape.`);}
  else{const next=solution.find(s=>!placed.some(p=>p.id===s.id));if(next){placed.push(clone(next));lastApp=next.id;message(`${appById(next.id).name} found its place. Use its edges to help the next app.`);}}
  save();render(lastApp);
});
$('help-button').addEventListener('click',()=>$('help').showModal());$('close-help').addEventListener('click',()=>$('help').close());
$('share').addEventListener('click',async()=>{if(!finished(level,placed))return;const emoji={sky:'🟦',rose:'🟥',mint:'🟩',butter:'🟨',lilac:'🟪',peach:'🟧'};const mosaic=Array.from({length:level.rows},(_,r)=>Array.from({length:level.cols},(_,c)=>emoji[appById(placed.find(p=>p.cells.includes(r*level.cols+c)).id).tone]).join('')).join('\n');const address=location.protocol.startsWith('http')?`\n${location.href}`:'';const text=`Widget Shuffle · ${level.name} · ${level.cols} × ${level.rows}\n${mosaic}\n${formatTime(elapsed)} · ${moves} moves · ${hints} hints\nA place for every app.${address}`;
  await copyText(text,'Result copied. Ready to share.');
});
const fallback=document.createElement('dialog');fallback.id='share-fallback';fallback.innerHTML='<h2>Share this screen</h2><textarea id="share-text" aria-label="Share text" readonly rows="11"></textarea><button type="button">Close</button>';document.body.append(fallback);fallback.querySelector('button').addEventListener('click',()=>fallback.close());fallback.querySelector('textarea').style.cssText='width:100%;font:14px/1.6 monospace;padding:10px;border:1px solid #bac8b7;border-radius:10px;background:#fffef7;color:#293d35';
async function copyText(text,success){try{await navigator.clipboard.writeText(text);message(success);}catch{$('share-text').value=text;$('share-fallback').showModal();}}
setInterval(()=>{if(!generating&&started&&!finished(level,placed)&&!document.hidden&&!$('help').open){elapsed++;$('timer').textContent=formatTime(elapsed);if(elapsed%5===0)save();}},1000);
function rememberSession(){
 save();sessions.delete(activeMode);sessions.set(activeMode,clone({placed,history,hints,moves,elapsed,started,lastApp}));
 if(sessions.size>22){const oldest=[...sessions.keys()].find(key=>key.startsWith('seed:'));if(oldest)sessions.delete(oldest);}
}
function showPuzzle(next,mode,initial=false){
  if(!initial)rememberSession();
  if(drag&&board.hasPointerCapture(drag.pointer))board.releasePointerCapture(drag.pointer);
  activeMode=mode;level=next;storageKey='widget-shuffle-'+level.id;solution=solve(level,1)[0];
  corner=null;selection=null;drag=null;resize=false;inspectingId=null;restore();document.body.dataset.mode=level.cols>=7?'expert':level.cols>=6?'hard':'intro';document.body.dataset.device=level.device;document.body.dataset.orientation=level.orientation;
  $('campaign-mode').setAttribute('aria-pressed',String(!level.seed));$('endless-mode').setAttribute('aria-pressed',String(!!level.seed));
  $('campaign-heading').hidden=!!level.seed;$('level-picker').hidden=!!level.seed;$('campaign-navigation').hidden=!!level.seed;$('endless-panel').hidden=!level.seed;
  if(level.seed){lastEndlessSeed=level.seed;$('seed-input').value=level.seed;}else lastCampaignRank=mode;
  board.style.setProperty('--cols',level.cols);board.style.setProperty('--rows',level.rows);
  board.style.setProperty('--board-ratio',`${level.cols} / ${level.rows*(level.cols>=6?.8:.91)}`);
  board.setAttribute('aria-label',`${level.name} home screen. ${level.cols} columns and ${level.rows} rows. Drag or select two corner cells.`);
  $('screen-kicker').textContent=`${level.seed?'ENDLESS':`LEVEL ${level.rank}`} · ${level.device==='tablet'?'TABLET':'PHONE'} · ${level.cols} × ${level.rows}`;
  $('level-description').textContent=`${level.seed?'A fresh arrangement':level.title}. ${level.apps.length} apps, ${level.cols*level.rows} spaces, one satisfying layout.`;
  $('difficulty-note').textContent=`${level.difficulty} · ${level.device==='tablet'?'Tablet':'Phone'} · ${level.orientation==='landscape'?'Landscape':'Portrait'}`;
  window.history.replaceState(null,'',puzzleHash(level));
  if(level.seed||finished(level,placed))save();
  else try{localStorage.setItem('widget-shuffle-active',mode);}catch{}
  render();message(`${level.seed?`Endless · ${level.difficulty}`:level.name}. ${level.apps.length} apps, one complete layout. Progress is saved separately.`);
}
function chooseLevel(mode,initial=false){if(!generating&&levels[mode])showPuzzle(levels[mode],mode,initial);}
function freshSeed(){
 const numbers=new Uint32Array(2);crypto.getRandomValues(numbers);
 return `v1-${[...numbers].map(n=>n.toString(36)).join('-')}`;
}
function setGenerating(value){
 generating=value;document.querySelector('main').setAttribute('aria-busy',String(value));board.inert=value;
 for(const element of document.querySelectorAll('[data-level],.play-modes button,#seed-input,#load-seed,#copy-puzzle,.puzzle-actions button,.tools button,#previous-level,#continue-level,#share'))element.disabled=value;
}
async function chooseSeed(input,initial=false){
 if(generating)return;
 let seed;
 try{seed=normalizeSeed(input);}catch(error){message(error.message,true);return;}
 if(seed===level.seed){$('seed-input').value=seed;window.history.replaceState(null,'',puzzleHash(level));message('This seed is already open. Reset starts its layout again.');return;}
 setGenerating(true);message('Making room for a new puzzle…');
 await new Promise(resolve=>setTimeout(resolve,0));
 try{
  const iterator=generatePuzzle(seed);let step,count=0;
  do{step=iterator.next();if(!step.done&&++count%12===0)await new Promise(resolve=>setTimeout(resolve,0));}while(!step.done);
  showPuzzle(step.value,`seed:${seed}`,initial);
 }catch(error){message(`Could not open that puzzle. ${error.message}`,true);window.history.replaceState(null,'',puzzleHash(level));}
 finally{setGenerating(false);render();}
}
for(const [rank,entry] of Object.entries(levels)){const button=document.createElement('button');button.type='button';button.dataset.level=rank;button.setAttribute('aria-pressed','false');button.innerHTML=`<span class="level-number">${rank}<span class="level-mark" aria-hidden="true"></span></span><span class="level-difficulty">${entry.difficulty}</span>`;button.title=entry.title;button.addEventListener('click',()=>{if(activeMode!==rank)chooseLevel(rank);});$('level-picker').append(button);}
$('previous-level').addEventListener('click',()=>chooseLevel(String(level.rank-1)));
$('next-level').addEventListener('click',()=>level.seed?chooseSeed(freshSeed()):chooseLevel(String(level.rank+1)));
$('continue-level').addEventListener('click',()=>{if(level.seed)chooseSeed(freshSeed());else chooseLevel(level.rank===10?'1':String(level.rank+1));document.querySelector('.site-header').scrollIntoView({behavior:'instant',block:'start'});});
$('campaign-mode').addEventListener('click',()=>{if(level.seed)chooseLevel(lastCampaignRank);});
$('endless-mode').addEventListener('click',()=>{if(!level.seed)chooseSeed(lastEndlessSeed||freshSeed());});
$('seed-form').addEventListener('submit',event=>{event.preventDefault();chooseSeed($('seed-input').value);});
$('copy-puzzle').addEventListener('click',()=>{if(!level.seed)return;const url=new URL(location.protocol.startsWith('http')?location.href:'https://lamkeykey2010.github.io/widget-shuffle/');url.hash=puzzleHash(level);copyText(`Widget Shuffle · ${level.difficulty}\nSeed: ${level.seed}\n${url.href}`,'Puzzle link copied. Same seed, same screen.');});
window.addEventListener('hashchange',()=>{try{const route=routeFromHash(location.hash);if(route.seed){if(route.seed!==level.seed)chooseSeed(route.seed);}else if(route.rank!==activeMode)chooseLevel(route.rank);}catch(error){window.history.replaceState(null,'',puzzleHash(level));message(error.message,true);}});
window.addEventListener('pagehide',save);new ResizeObserver(adaptWidgets).observe(board);
if(initialRoute.seed)chooseSeed(initialRoute.seed,true);else chooseLevel(initialRoute.rank,true);
if(initialError)message(initialError,true);
