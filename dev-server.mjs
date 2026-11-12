import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import news from './api/news.js';
import watch from './api/watch.js';
import coverage from './api/coverage.js';
import milestones from './api/milestones.js';
import preview from './api/article-preview.js';
import storedNews from './api/stored-news.js';
import storageStatus from './api/storage-status.js';
import ingest from './api/ingest.js';
import publisherStats from './api/publisher-stats.js';
const assets=new Map([['/','index.html'],['/index.html','index.html'],['/article-preview.js','article-preview.js'],['/bias-extension.js','bias-extension.js'],['/layout-redesign.js','layout-redesign.js'],['/source-audit.js','source-audit.js'],['/favicon.svg','favicon.svg'],['/publisher-directory.js','publisher-directory.js'],['/product-shell.js','product-shell.js'],['/editorial-home.js','editorial-home.js'],['/story-watch.js','story-watch.js'],['/official-milestones.js','official-milestones.js'],['/coverage-metrics.js','coverage-metrics.js'],['/blindspots-core.js','blindspots-core.js'],['/newsroom-visuals.js','newsroom-visuals.js'],['/story-research.js','story-research.js'],['/story-cluster-core.js','story-cluster-core.js'],['/evidence-core.js','evidence-core.js'],['/story-evidence.js','story-evidence.js'],['/publisher-profiles.js','publisher-profiles.js'],['/publisher-profiles.json','publisher-profiles.json'],['/dashboard-workspace.css','dashboard-workspace.css'],['/dashboard-workspace.js','dashboard-workspace.js'],['/premium-editorial.css','premium-editorial.css'],['/premium-editorial.js','premium-editorial.js'],['/publisher-catalog.json','publisher-catalog.json'],['/publisher-observations.json','publisher-observations.json'],['/editorial-review-core.js','editorial-review-core.js'],['/editorial-review.js','editorial-review.js']]);
createServer(async(req,res)=>{
 try{
  const u=new URL(req.url||'/','http://localhost');
  if(u.pathname==='/api/news')return await news(req,res);
  if(u.pathname==='/api/stored-news')return await storedNews(req,res);
  if(u.pathname==='/api/publisher-stats')return await publisherStats(req,res);
  if(u.pathname==='/api/storage-status')return await storageStatus(req,res);
  if(u.pathname==='/api/ingest')return await ingest(req,res);
  if(u.pathname==='/api/watch')return await watch(req,res);
  if(u.pathname==='/api/coverage')return await coverage(req,res);
  if(u.pathname==='/api/milestones')return await milestones(req,res);
  if(u.pathname==='/api/article-preview')return await preview(req,res);
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end('Method not allowed')}
  const file=assets.get(u.pathname);
  if(!file){res.writeHead(404);return res.end('Not found')}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.json')?'application/json; charset=utf-8':'text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-cache');
  if(req.method==='HEAD')return res.end();
  res.end(await readFile(new URL('./'+file,import.meta.url)));
 }catch(e){console.error(e);if(!res.headersSent)res.writeHead(500);res.end('Server error')}
}).listen(Number(process.env.PORT||3000));
