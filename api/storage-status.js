/* Public operational summary with no secrets or article text. */
import {databaseConfigured,database,getStatus} from '../lib/news-store.js';
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'method_not_allowed'}))}
 if(!databaseConfigured()){res.statusCode=200;return res.end(JSON.stringify({state:'not_connected',articles:0,publishers:0,topicLinks:0,lastSuccess:null}))}
 try{
  const sql=await database(),d=await getStatus(sql);
  res.statusCode=200;
  return res.end(JSON.stringify({state:d.last_success?'collecting':'waiting_for_first_ingest',
   articles:d.articles,publishers:d.publishers,topicLinks:d.topic_links,lastSuccess:d.last_success,
   runs:d.runs}));
 }catch(e){
  res.statusCode=503;
  return res.end(JSON.stringify({state:'unavailable',error:'database_not_initialized_or_unreachable'}));
 }
}
