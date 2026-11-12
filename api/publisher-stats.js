/* Read-only observed source statistics — counts only actual stored metadata, not catalog seeds. */
import {databaseConfigured,database,getPublisherStatistics} from '../lib/news-store.js';
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public,max-age=0,s-maxage=120');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'method_not_allowed'}))}
 if(!databaseConfigured()){res.statusCode=503;return res.end(JSON.stringify({error:'database_not_connected',publishers:[]}))}
 try{
  const data=await getPublisherStatistics(await database());
  res.statusCode=200;
  return res.end(JSON.stringify({schema:1,status:'observed',...data,
   warning:'These are deduplicated stored headline links across sampled feeds. An outlet missing here has not necessarily ignored a story. Country refers to publisher identity only when independently checked.'}));
 }catch(e){
  console.error('Publisher archive statistics failed',String(e?.message||e).slice(0,180));
  res.statusCode=503;
  return res.end(JSON.stringify({error:'publisher_statistics_unavailable',publishers:[]}));
 }
}
