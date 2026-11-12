/* Protected Vercel Cron entry point. Requires CRON_SECRET + DATABASE_URL.
 * Reuses the existing multi-provider API and stores headline metadata only.
 */
import {timingSafeEqual} from 'node:crypto';
import liveNews from './news.js';
import {databaseConfigured,database,ensureSchema,beginRun,finishRun,saveBatch} from '../lib/news-store.js';
export const config={maxDuration:60};
const json=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data))};
function authorized(req){
 const secret=process.env.CRON_SECRET;
 if(!secret||secret.length<24)return false;
 const provided=String(req.headers?.authorization||'').replace(/^Bearer\s+/i,'');
 const a=Buffer.from(provided),b=Buffer.from(secret);
 return a.length===b.length&&timingSafeEqual(a,b);
}
function todayTopics(){
 const day=Math.floor(Date.now()/86400000);
 const groups=[
  ['netherlands','dutch-politics','housing','public-finances'],
  ['europe','eu-policy','eu-institutions','digital-policy'],
  ['world','geopolitics','gaza','ukraine','business']
 ];
 return groups.flatMap(g=>[g[0],g[1+(day%(g.length-1))]]);
}
async function sample(topic){
 const response={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=String(body||'')}};
 const request={method:'GET',url:'/api/news?'+new URLSearchParams({topic,period:'7'}),headers:{}};
 await liveNews(request,response);
 if(response.statusCode!==200)throw Error('feed request failed');
 const data=JSON.parse(response.body||'{}');
 if(!Array.isArray(data.articles)||!data.articles.length)throw Error('feed returned no articles');
 return {articles:data.articles,sourceHealth:data.sourceHealth||[]};
}
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'method_not_allowed'});
 if(!authorized(req))return json(res,401,{error:'cron_secret_required'});
 if(!databaseConfigured())return json(res,503,{error:'database_not_connected'});
 let sql,id;
 const topics=todayTopics();
 try{
  sql=await database();await ensureSchema(sql);id=await beginRun(sql,topics.length);
  // Two independent fetches at once limits load on news providers.
  let successfulTopics=0,recordsReceived=0,savedRecords=0,sourceFailures=0;
  for(let i=0;i<topics.length;i+=2){
   const settled=await Promise.allSettled(topics.slice(i,i+2).map(async topic=>{
    const results=await sample(topic);
    const stored=await saveBatch(sql,topic,results.articles);
    return {topic,stored,failures:results.sourceHealth.filter(x=>x.status==='unavailable').length};
   }));
   for(const r of settled){
    if(r.status==='fulfilled'){
     successfulTopics++;recordsReceived+=r.value.stored.received; savedRecords+=r.value.stored.saved;
     sourceFailures+=r.value.failures;
    }else sourceFailures++;
   }
  }
  const status=successfulTopics===topics.length?'completed':successfulTopics?'partial':'failed';
  await finishRun(sql,id,{status,successfulTopics,recordsReceived,savedRecords,sourceFailures});
  return json(res,successfulTopics?200:503,{status,requestedTopics:topics.length,successfulTopics,
   recordsReceived,savedRecords,sourceFailures});
 }catch(e){
  if(sql&&id)try{await finishRun(sql,id,{status:'failed',successfulTopics:0,recordsReceived:0,savedRecords:0,sourceFailures:topics.length})}catch{}
  console.error('OpenLens ingestion failed',e?.message||'unknown');
  return json(res,503,{status:'failed',error:'ingestion_unavailable'});
 }
}
