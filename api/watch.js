/* On-demand Story Watch discovery. No background process or automatic alerts. */
const STOP=new Set('de het een en van voor met naar over door op om uit als zijn is wordt bij dat die deze dit er in aan te tot ook wat wie where with from after before about that this the and for its are was were have has will new meer nieuws hoe wat wie waarom nieuwsbericht'.split(' '));
export function watchTerms(input){
 const words=String(input??'').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]*/gu)||[];
 const clean=[...new Set(words.filter(w=>w.length>=3&&!STOP.has(w)))].slice(0,9);
 return clean;
}
export function cleanWatchQuery(input){
 if(typeof input!=='string'||input.length>180)return null;
 const words=watchTerms(input);
 if(words.length<2)return null;
 return words.slice(0,7).join(' ');
}
export function parseWatchRss(xml,locale,max=35){
 const decode=v=>String(v||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
  .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{try{return String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))}catch{return ''}})
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[n.toLowerCase()]));
 const get=(tag,xml)=>decode(xml.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]||'').trim();
 const results=[],seen=new Set();
 for(const m of String(xml||'').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const block=m[1],source=decode(block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i)?.[1]||'').trim()||'Unidentified source';
  const raw=get('title',block),title=raw.endsWith(' - '+source)?raw.slice(0,-source.length-3):raw;
  const url=get('link',block),ms=Date.parse(get('pubDate',block));
  if(!/^https:\/\/[^<>"\s]+$/i.test(url)||!title||seen.has(url))continue;
  seen.add(url);
  results.push({url,title:title.slice(0,310),source:source.slice(0,160),when:Number.isFinite(ms)?new Date(ms).toISOString():null,
   locale,discovery:'story-watch-search'});
  if(results.length>=max)break;
 }
 return results;
}
const feedUrl=(q,code,lang)=>{
 const u=new URL('https://news.google.com/rss/search');
 u.searchParams.set('q',q);u.searchParams.set('hl',code==='NL'?'nl':'en-GB');
 u.searchParams.set('gl',code);u.searchParams.set('ceid',code+':'+lang);return u.href;
};
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');return res.end(JSON.stringify({error:'Use GET'}))}
 const p=new URL(req.url||'/','http://localhost').searchParams;
 const query=cleanWatchQuery(p.get('q'));
 if(!query){res.statusCode=400;return res.end(JSON.stringify({error:'Please use two or more distinctive keywords (up to seven).'}))}
 const days=['1','7','30'].includes(p.get('days'))?p.get('days'):'7';
 const urls=[feedUrl(query+' when:'+days+'d','NL','nl'),feedUrl(query+' when:'+days+'d','GB','en')];
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),8500);
 try{
  const responses=await Promise.allSettled(urls.map(async(url,i)=>{
   const response=await fetch(url,{signal:ctl.signal,headers:{'User-Agent':'OpenLens/1.0 (story-watch-on-demand)'}});
   if(!response.ok)throw new Error('Feed HTTP '+response.status);
   const raw=await response.text();if(raw.length>1_000_000)throw new Error('Feed exceeded size limit');
   return parseWatchRss(raw,i?'English / Europe':'Dutch / Netherlands',40);
  }));
  const all=[],seen=new Set();
  for(const r of responses)if(r.status==='fulfilled')for(const article of r.value){
   if(seen.has(article.url))continue;seen.add(article.url);all.push(article);
  }
  if(!responses.some(r=>r.status==='fulfilled')){res.statusCode=503;return res.end(JSON.stringify({error:'Sources temporarily unavailable. Try again.'}))}
  return res.end(JSON.stringify({query,articles:all.slice(0,70),fetchedAt:new Date().toISOString(),
   feedsSucceeded:responses.filter(r=>r.status==='fulfilled').length,
   warning:'Results are tentative keyword matches, not confirmed updates to one event. New links are discovered only when you press Check. No background checks or notifications.'}));
 }finally{clearTimeout(timeout)}
}
