import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import news from './api/news.js';
import watch from './api/watch.js';
import milestones from './api/milestones.js';
import preview from './api/article-preview.js';
const assets=new Map([['/','index.html'],['/index.html','index.html'],['/article-preview.js','article-preview.js'],['/bias-extension.js','bias-extension.js'],['/layout-redesign.js','layout-redesign.js'],['/source-audit.js','source-audit.js'],['/favicon.svg','favicon.svg'],['/publisher-directory.js','publisher-directory.js'],['/product-shell.js','product-shell.js'],['/editorial-home.js','editorial-home.js'],['/story-watch.js','story-watch.js'],['/editorial-review-core.js','editorial-review-core.js'],['/editorial-review.js','editorial-review.js']]);
createServer(async(req,res)=>{
 try{
  const u=new URL(req.url||'/','http://localhost');
  if(u.pathname==='/api/news')return await news(req,res);
  if(u.pathname==='/api/watch')return await watch(req,res);
  if(u.pathname==='/api/milestones')return await milestones(req,res);
  if(u.pathname==='/api/article-preview')return await preview(req,res);
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end('Method not allowed')}
  const file=assets.get(u.pathname);
  if(!file){res.writeHead(404);return res.end('Not found')}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-cache');
  if(req.method==='HEAD')return res.end();
  res.end(await readFile(new URL('./'+file,import.meta.url)));
 }catch(e){console.error(e);if(!res.headersSent)res.writeHead(500);res.end('Server error')}
}).listen(Number(process.env.PORT||3000));
