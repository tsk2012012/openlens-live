import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import handler from './api/news.js';
const html=await readFile(new URL('./index.html',import.meta.url));
const port=Number(process.env.PORT||3000);
createServer(async(req,res)=>{
  try {
    const path=new URL(req.url,'http://localhost').pathname;
    if(path==='/api/news')return await handler(req,res);
    if(path==='/'||path==='/index.html'){
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.setHeader('Cache-Control','no-cache');
      res.end(html);
    } else {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found')}
  } catch(e){res.writeHead(500,{'Content-Type':'text/plain'});res.end('Server error')}
}).listen(port,()=>console.log(`OpenLens is running at http://localhost:${port}`));
