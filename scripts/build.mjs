import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const source=new URL('../src/',import.meta.url),out=new URL('../dist/',import.meta.url);
const files=['index.html','styles.css','logic.mjs','levels.mjs','analysis.mjs','generator.mjs','state.mjs','app.mjs'];
const [html,css,...modules]=await Promise.all(files.map(name=>readFile(new URL(name,source),'utf8')));
const script=modules.map(code=>code.replace(/^import .*?;\r?\n/gm,'').replace(/^export /gm,'')).join('\n');
const bundled=html.replace('<link rel="stylesheet" href="styles.css">',()=>`<style>\n${css}\n</style>`).replace('<script type="module" src="app.mjs"></script>',()=>`<script type="module">\n${script}\n</script>`);
await mkdir(out,{recursive:true});await writeFile(new URL('index.html',out),bundled);await writeFile(new URL('.nojekyll',out),'');await writeFile(new URL('icon.svg',out),await readFile(new URL('icon.svg',source)));
console.log('Built '+fileURLToPath(out));
