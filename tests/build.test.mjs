import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
test('publication sources compile into one self-contained game script',async()=>{
 const modules=await Promise.all(['logic.mjs','levels.mjs','state.mjs','app.mjs'].map(name=>readFile(new URL('../src/'+name,import.meta.url),'utf8')));
 const source=modules.map(code=>code.replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'')).join('\n');
 const compiled=spawnSync(process.execPath,['--check','--input-type=module'],{input:source,encoding:'utf8'});assert.equal(compiled.status,0,compiled.stderr);
 assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|WebSocket/);
 const html=await readFile(new URL('../src/index.html',import.meta.url),'utf8');assert.match(html,/id="level-picker"/);assert.match(html,/id="continue-level"/);assert.match(source,/data-shrink/);
});
