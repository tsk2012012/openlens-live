/* Read-only archive route. Does not replace the live feed if storage is absent. */
import {INGEST_TOPICS} from '../lib/news-normalize.js';
import {databaseConfigured,database,getArticles} from '../lib/news-store.js';
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','public,max-age=0,s-maxage=120');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'method_not_allowed'}))}
 if(!databaseConfigured()){res.statusCode=503;return res.end(JSON.stringify({error:'database_not_connected',articles:[]}))}
 const params=new URL(req.url||'/','https://openlens.invalid').searchParams;
 const topic=params.get('topic')||'netherlands',days=Number(params.get('period'));
 if(!INGEST_TOPICS.includes(topic)){res.statusCode=400;return res.end(JSON.stringify({error:'unknown_topic',articles:[]}))}
 try{
  const articles=await getArticles(await database(),topic,[1,7,30].includes(days)?days:7,160);
  res.statusCode=200;
  return res.end(JSON.stringify({articles,topic,provider:'OpenLens historical PostgreSQL sample',historical:true,
   warning:'Archived links, headlines and provider timestamps. Not necessarily full publisher publication times. Not a complete news inventory.'}));
 }catch(e){res.statusCode=503;return res.end(JSON.stringify({error:'database_unavailable',articles:[]}))}
}
