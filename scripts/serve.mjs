import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.woff2':'font/woff2','.txt':'text/plain'};
http.createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Preview at http://127.0.0.1:4173'));
