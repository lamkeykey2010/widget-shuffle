import http from 'node:http';
import {readFile} from 'node:fs/promises';
const allowed=new Set(['index.html','icon.svg']);
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const name=pathname.replace(/^\/widget-shuffle\/?/,'').replace(/^\//,'')||'index.html';if(!allowed.has(name)){res.writeHead(404);return res.end('Not found');}const data=await readFile(new URL('../dist/'+name,import.meta.url));res.writeHead(200,{'Content-Type':name.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end();}}).listen(4197,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4197/widget-shuffle/'));
