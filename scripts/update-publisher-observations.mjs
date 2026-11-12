/* OpenLens scheduled public headline sample. Does not infer political beliefs from headlines. */
import fs from 'node:fs/promises';
const base=process.env.OPENLENS_URL||'https://openlens-live.vercel.app';
const path='publisher-observations.json';
const jobs=[['nl','netherlands'],['nl','dutch-politics'],['nl','housing'],['nl','public-finances'],['eu','europe'],['eu','eu-policy'],['eu','eu-institutions'],['eu','digital-policy'],['world','world'],['world','geopolitics'],['world','gaza'],['world','ukraine'],['world','business']];
const prev=await fs.readFile(path,'utf8').then(JSON.parse).catch(()=>({articles:[]}));
const records=new Map((prev.articles||[]).filter(a=>a&&a.url&&a.title).map(a=>[a.url,a]));
let ok=0;const checks=[];
for(let i=0;i<jobs.length;i+=3){
 const batch=await Promise.all(jobs.slice(i,i+3).map(async ([region,topic])=>{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),22000);
  try{
   const url=new URL('/api/news',base);url.searchParams.set('topic',topic);url.searchParams.set('period','7');
   const res=await fetch(url,{signal:ctl.signal,headers:{Accept:'application/json'}});
   if(!res.ok)throw Error('HTTP '+res.status);
   const data=await res.json();if(!Array.isArray(data.articles))throw Error('Unexpected API response');
   return {region,topic,articles:data.articles};
  }catch(e){return {region,topic,error:String(e.message||e)}}finally{clearTimeout(timer)}
 }));
 for(const item of batch){
  checks.push({region:item.region,topic:item.topic,count:item.articles?.length||0,ok:!!item.articles});
  if(!item.articles)continue;ok++;
  for(const a of item.articles){
   if(typeof a.url!=='string'||!/^https:\/\//.test(a.url)||!a.title)continue;
   const publisher=String(a.source||a.domain||'').trim().slice(0,120);
   if(!publisher||/^unknown/i.test(publisher))continue;
   const old=records.get(a.url);
   records.set(a.url,{url:a.url,title:String(a.title).slice(0,350),publisher,region:item.region,topic:item.topic,
    date:a.when||null,dateType:a.dateType||'unknown',firstSeen:old?.firstSeen||new Date().toISOString(),lastSeen:new Date().toISOString()});
  }
 }
}
if(!ok)throw Error('Every live news sample failed; previous database left untouched');
const cutoff=Date.now()-30*86400000;
const articles=[...records.values()].filter(a=>Date.parse(a.lastSeen||0)>cutoff).sort((a,b)=>Date.parse(b.lastSeen||0)-Date.parse(a.lastSeen||0)).slice(0,6000);
const names=new Set(articles.map(a=>a.publisher.toLowerCase()));
const data={schema:1,generatedAt:new Date().toISOString(),windowDays:30,method:'Rolling sample of public news search results; not a complete publisher archive or a political bias classifier.',checks,successfulQueries:ok,totalQueries:jobs.length,publishersObserved:names.size,articles};
await fs.writeFile(path,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({successfulQueries:ok,totalQueries:jobs.length,publishersObserved:names.size,articles:articles.length}));
