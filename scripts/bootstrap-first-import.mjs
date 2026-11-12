/* One-time, Vercel build-only archive bootstrap.
 * Uses configured DATABASE_URL inside Vercel, never exposes credentials publicly.
 * Schema is idempotent and article URLs are upserted.
 */
import {databaseConfigured,database,ensureSchema,beginRun,finishRun,saveBatch} from '../lib/news-store.js';
import liveNews from '../api/news.js';
const topics=['netherlands','europe','world'];
async function sample(topic){
 const res={statusCode:200,setHeader(){},end(body){this.body=String(body||'')}};
 await liveNews({method:'GET',url:'/api/news?'+new URLSearchParams({topic,period:'7'}),headers:{}},res);
 if(res.statusCode!==200)throw Error('feed returned HTTP '+res.statusCode);
 const data=JSON.parse(res.body||'{}');
 if(!Array.isArray(data.articles)||data.articles.length===0)throw Error('no articles available');
 return data.articles;
}
if(!databaseConfigured()){
 console.log('OpenLens bootstrap SKIPPED: no DATABASE_URL in build environment');
}else{
 let sql,runId;
 try{
  sql=await database();await ensureSchema(sql);
  console.log('OpenLens bootstrap SCHEMA_READY');
  runId=await beginRun(sql,topics.length);
  let received=0,saved=0,success=0,failed=0;
  // Sequential requests keep upstream RSS traffic bounded.
  for(const topic of topics){
   try{
    const articles=await sample(topic);
    const result=await saveBatch(sql,topic,articles);
    received+=result.received;saved+=result.saved;success++;
    console.log('OpenLens bootstrap TOPIC '+topic+' saved='+result.saved);
   }catch(e){
    failed++;console.log('OpenLens bootstrap TOPIC_FAILED '+topic+' reason='+String(e.message||e).slice(0,200));
   }
  }
  const status=success===topics.length?'completed':success?'partial':'failed';
  await finishRun(sql,runId,{status,successfulTopics:success,recordsReceived:received,savedRecords:saved,sourceFailures:failed});
  console.log('OpenLens bootstrap RESULT '+JSON.stringify({status,topics:topics.length,success,saved,failed}));
 }catch(e){
  console.error('OpenLens bootstrap SCHEMA_OR_STORE_FAILED '+String(e.message||e).slice(0,250));
  if(sql&&runId)try{await finishRun(sql,runId,{status:'failed',successfulTopics:0,recordsReceived:0,savedRecords:0,sourceFailures:topics.length})}catch{}
  process.exitCode=1;
 }
}
