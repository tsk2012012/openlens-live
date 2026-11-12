/* Pure normalization for observed headline records; no full text or political judgments. */
const REGION_BY_TOPIC={
  netherlands:'nl','dutch-politics':'nl','local-government':'nl',housing:'nl','public-finances':'nl',
  europe:'eu','eu-policy':'eu','eu-institutions':'eu','digital-policy':'eu',
  world:'world',geopolitics:'world',ukraine:'world',gaza:'world',business:'world'
};
export const INGEST_TOPICS=Object.freeze([
 'netherlands','dutch-politics','housing','public-finances','europe','eu-policy',
 'eu-institutions','digital-policy','world','geopolitics','gaza','ukraine','business'
]);
export const topicRegion=topic=>REGION_BY_TOPIC[topic]||'world';
export const publisherKey=name=>String(name||'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().slice(0,150);
export function canonicalNewsUrl(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=='https:'||!u.hostname.includes('.')||u.username||u.password||u.port&&u.port!=='443')return null;
  if(/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)|\.(local|internal|test)$/i.test(u.hostname))return null;
  for(const key of [...u.searchParams.keys()])if(/^(utm_.+|fbclid|gclid|mc_cid|mc_eid|ref)$/i.test(key))u.searchParams.delete(key);
  u.hash='';return u.href.replace(/\/$/,'').slice(0,1990);
 }catch{return null}
}
function iso(value){
 const ms=Date.parse(value||'');
 return Number.isFinite(ms)&&ms<=Date.now()+86400000?new Date(ms).toISOString():null;
}
export function normalizeNewsArticle(raw,topic){
 if(!raw||typeof raw!=='object')return null;
 const url=canonicalNewsUrl(raw.url),title=String(raw.title||'').trim().slice(0,350);
 const name=String(raw.source||raw.domain||'').trim().slice(0,160),key=publisherKey(name);
 if(!url||title.length<10||!key||/^(unknown|unknown publisher|unknown outlet)$/.test(key))return null;
 const dateType=['publisher_pubdate','feed_pubdate','index_seen_time'].includes(raw.dateType)?raw.dateType:'unknown';
 const d=iso(raw.when||raw.published||raw.seendate);
 const host=new URL(url).hostname.toLowerCase().replace(/^www\./,'');
 const publisherDomain=host.endsWith('news.google.com')||host==='news.google.com'?null:host;
 return {
  url,title,publisherKey:key,publisherName:name,publisherDomain,
  provider:String(raw.provider||'Unknown aggregator').slice(0,100),
  dateType,publishedAt:dateType==='publisher_pubdate'||dateType==='feed_pubdate'?d:null,
  indexedAt:dateType==='index_seen_time'?d:null,
  language:String(raw.language||'Unknown').slice(0,45),
  imageUrl:canonicalNewsUrl(raw.imageUrl),
  region:topicRegion(topic),topic
 };
}
export function dedupeBatch(rawArticles,topic){
 const urls=new Map();
 for(const article of rawArticles||[]){
  const a=normalizeNewsArticle(article,topic);
  if(!a)continue;
  const prior=urls.get(a.url);
  if(!prior||(!prior.publishedAt&&a.publishedAt))urls.set(a.url,a);
 }
 return [...urls.values()];
}
