/* Investigate more coverage of one headline: search results are NOT automatic same-event matches. */
import {safeLink,gdeltUrl,parseGdelt} from './news-providers.js';
const STOP=new Set('de het een en van naar voor met die dat deze dit zijn werd worden kan om maar ook hoe door over bij uit als tot na iets nieuw nieuwe weer tegen nog wel nu vandaag gisteren terwijl meer nieuws nieuwsbericht eerste tweede nederland nederlandse kabinet regering staat minister europese europees eu europe uitkomst the and or of for from that this with were was have has will says say over amid after against what how why today news latest new report reports about by into near on in at to a an'.split(' '));
export const topicTerms=text=>[...new Set((String(text||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)||[]).filter(x=>!STOP.has(x)))].slice(0,16);
export function compareTitle(query,title){
 const q=topicTerms(query),t=topicTerms(title);
 const overlap=q.filter(x=>t.includes(x)),den=Math.max(2,Math.min(q.length,t.length));
 const score=q.length&&t.length?overlap.length/den:0;
 return {overlap:overlap.slice(0,8),score:Math.round(score*100),candidate:overlap.length>=2&&score>=0.38};
}
const decode=x=>String(x||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi,'$1').replace(/<[^>]+>/g,' ')
.replace(/&#(\d+);/g,(_,n)=>{try{return String.fromCodePoint(Number(n))}catch{return ''}})
.replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[n.toLowerCase()])).trim();
const xmlTag=(tag,str)=>decode(String(str).match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]||'');
export function parseGoogleCandidates(xml,headline,locale,max=65){
 const list=[],seen=new Set();
 for(const m of String(xml||'').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const block=m[1],source=decode(block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i)?.[1])||'Onbekende uitgever';
  const raw=xmlTag('title',block),title=raw.endsWith(' - '+source)?raw.slice(0,-source.length-3):raw;
  const url=safeLink(xmlTag('link',block)),ms=Date.parse(xmlTag('pubDate',block));
  if(!url||!title||!Number.isFinite(ms)||seen.has(url))continue;
  seen.add(url);const match=compareTitle(headline,title);
  if(!match.candidate)continue;
  list.push({url,title:title.slice(0,320),source:source.slice(0,120),when:new Date(ms).toISOString(),
   provider:'Google News RSS',linkType:'News aggregator redirect',language:locale,
   score:match.score,matchedKeywords:match.overlap,verification:'Unverified title-similarity candidate'});
  if(list.length>=max)break;
 }
 return list;
}
export function rankCandidates(headline,items,existingUrls=[]){
 const known=new Set(existingUrls),dedup=new Map();
 for(const a of items){
  const url=safeLink(a.url);if(!url||known.has(url))continue;
  const m=compareTitle(headline,a.title);
  if(!m.candidate)continue;
  if(dedup.has(url))continue;
  dedup.set(url,{...a,url,score:m.score,matchedKeywords:m.overlap,verification:'Unverified candidate, not confirmed same event'});
 }
 return [...dedup.values()].sort((a,b)=>b.score-a.score||(Date.parse(b.when)||0)-(Date.parse(a.when)||0)).slice(0,65);
}
const googleQuery=(search,locality,days)=>{
 const [gl,hl,lang]=locality,u=new URL('https://news.google.com/rss/search');
 for(const [k,v] of Object.entries({q:search+' when:'+days+'d',gl,hl,ceid:gl+':'+lang}))u.searchParams.set(k,v);
 return u.href;
};
const asGdelt=(a)=>({...a,linkType:'Original publisher link',score:0,verification:'Unverified title-similarity candidate'});
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.statusCode=405;return res.end(JSON.stringify({error:'Use GET'}))}
 const p=new URL(req.url||'/','http://localhost').searchParams;
 const title=String(p.get('headline')||'').trim();
 if(title.length<12||title.length>220||topicTerms(title).length<2){res.statusCode=400;return res.end(JSON.stringify({error:'Provide a descriptive headline with two distinct keywords.'}))}
 const days=['1','7','30'].includes(p.get('days'))?Number(p.get('days')):7;
 const search=topicTerms(title).slice(0,5).join(' ');
 const tasks=[
  {name:'Google NL',url:googleQuery(search,['NL','nl','nl'],days),parse:x=>parseGoogleCandidates(x,title,'Nederlands')},
  {name:'Google EN',url:googleQuery(search,['GB','en-GB','en'],days),parse:x=>parseGoogleCandidates(x,title,'English')},
  {name:'GDELT',url:gdeltUrl('all',days).replace(/query=[^&]*/, 'query='+encodeURIComponent(search)),
   parse:x=>parseGdelt(JSON.parse(x)).map(asGdelt)}
 ];
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),11500);
 try{
  const searches=await Promise.allSettled(tasks.map(async task=>{
   const r=await fetch(task.url,{signal:controller.signal,headers:{'User-Agent':'OpenLens/1.0 (event-based source research)'}});
   if(!r.ok)throw Error('Upstream HTTP '+r.status);
   const body=await r.text();if(body.length>1800000)throw Error('Response too large');
   return {name:task.name,items:task.parse(body)};
  }));
  const status=searches.map((x,i)=>({source:tasks[i].name,status:x.status==='fulfilled'?'ok':'unavailable',
   count:x.status==='fulfilled'?x.value.items.length:0}));
  const all=searches.flatMap(r=>r.status==='fulfilled'?r.value.items:[]);
  const ranked=rankCandidates(title,all);
  res.statusCode=200;return res.end(JSON.stringify({
   query:search,headline:title,checkedAt:new Date().toISOString(),matches:ranked,sourceStatus:status,
   warning:'Keyword similarity is not evidence that articles describe the same event. Publishers, language, timestamps and source links require manual verification. A missing article is not proof of deliberate omission.'
  }));
 }finally{clearTimeout(timer)}
}
