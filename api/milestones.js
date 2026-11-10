/* Official public-affairs milestones for user-initiated Story Watch checks.
 * Direct original sources only: Tweede Kamer OData v5 and EUR-Lex RSS.
 * Source authenticity != topical relevance. Never infer enactment from proposals.
 */
import {cleanWatchQuery,watchTerms} from './watch.js';
const DUTCH='https://gegevensmagazijn.tweedekamer.nl/OData/v5/';
const EU='https://eur-lex.europa.eu/EN/display-feed.rss?rssId=';
const MAX_BODY=1_250_000;
const relevantKinds={
 Activiteit:'Parliamentary activity',Zaak:'Parliamentary case',Document:'Parliamentary document'
};
const cleanText=x=>String(x??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const day=v=>Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
const xmlDecode=v=>String(v??'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
 .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{try{return String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))}catch{return ''}})
 .replace(/&(amp|lt|gt|quot|apos|nbsp|hellip|ndash|mdash);/gi,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',hellip:'…',ndash:'–',mdash:'—'}[n.toLowerCase()]));
const validOfficialLink=x=>{try{const u=new URL(x);return u.protocol==='https:'&&
 ['gegevensmagazijn.tweedekamer.nl','eur-lex.europa.eu'].includes(u.hostname)&&!u.username&&!u.password?u.href:null}catch{return null}};
export function makeDutchUrl(type,query,days=30,now=Date.now()){
 if(!Object.keys(relevantKinds).includes(type))throw Error('Unknown parliamentary entity');
 const terms=watchTerms(query).filter(w=>w.length>=4).slice(0,3);
 if(!terms.length)throw Error('No searchable parliamentary keywords');
 const u=new URL(type,DUTCH);
 const cols=type==='Activiteit'?['Onderwerp']:['Titel','Onderwerp'];
 const clauses=terms.flatMap(term=>cols.map(col=>"contains(tolower("+col+"),'"+term.replaceAll("'","''")+"')"));
 const start=new Date(now-Math.max(7,Math.min(Number(days)||30,90))*86400000).toISOString().slice(0,10);
 // Only verified current v5 attributes; no vote-result status inference.
 u.searchParams.set('$filter',"( "+clauses.join(' or ')+" ) and Datum ge "+start+"T00:00:00Z and Verwijderd eq false");
 u.searchParams.set('$select',type==='Activiteit'?'Id,Soort,Onderwerp,Datum,Status,Verwijderd':'Id,Soort,Titel,Onderwerp,Datum,Verwijderd');
 u.searchParams.set('$orderby','Datum desc');
 u.searchParams.set('$top','65');
 return u.href;
}
export function classifyDutch(type,kind,status){
 const k=String(kind||'').toLowerCase();
 if(type==='Activiteit'){
  if(k.includes('stemming'))return {label:'Parliamentary vote session',stage:'Activity, not a verified vote result'};
  if(k.includes('debat')||k.includes('overleg'))return {label:status==='Gepland'?'Debate scheduled':status==='Uitgevoerd'?'Debate held':'Parliamentary debate',stage:'Activity status only'};
  return {label:status==='Gepland'?'Meeting scheduled':'Parliamentary activity',stage:'Activity status only'};
 }
 if(/amendement|nota van wijziging/i.test(k))return {label:'Amendment registered',stage:'Filing or amendment; adoption not established'};
 if(/motie/i.test(k))return {label:'Motion registered',stage:'Motion filed; outcome not established'};
 if(/wetgeving|voorstel van wet|initiatiefwetgeving/i.test(k))return {label:'Legislative proposal registered',stage:'Proposed legislation, not enacted law'};
 if(/eu-voorstel|eu voorstel/i.test(k))return {label:'EU proposal discussed in parliament',stage:'Parliamentary case or document'};
 return {label:relevantKinds[type],stage:'Parliamentary record, outcome not established'};
}
export function parseDutchOdata(json,type){
 const rows=Array.isArray(json?.value)?json.value:[];
 return rows.slice(0,160).flatMap(item=>{
  const id=String(item?.Id||'').toLowerCase();
  if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(id)||item.Verwijderd===true)return [];
  const date=day(item.Datum),title=cleanText(item.Titel||item.Onderwerp),kind=cleanText(item.Soort),status=cleanText(item.Status);
  if(!date||!title)return [];
  const typeInfo=classifyDutch(type,kind,status);
  return [{
   id:'tk-'+type.toLowerCase()+'-'+id,source:'Tweede Kamer Open Data',jurisdiction:'Netherlands',
   recordType:type,label:typeInfo.label,stageNote:typeInfo.stage,officialStatus:status||null,
   title:title.slice(0,360),date,sourceUrl:DUTCH+type+'('+id+')',
   originalRecord:true,matchStatus:'Keyword matched; case linkage not confirmed'
  }];
 });
}
export function parseEurlexRss(xml,feedKind,max=60){
 const results=[];
 const field=(tag,block)=>xmlDecode(block.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]||'');
 for(const item of String(xml||'').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const block=item[1],title=cleanText(field('title',block)),link=validOfficialLink(field('link',block));
  const d=day(field('pubDate',block)||field('dc:date',block));
  if(!title||!link||!d)continue;
  const id='eurlex-'+feedKind+'-'+String(link).replace(/[^A-Za-z0-9]/g,'').slice(-110);
  results.push({id,source:'EUR-Lex',jurisdiction:'European Union',
   recordType:feedKind==='commission-proposals'?'Commission proposal publication':'EU legislation publication',
   label:feedKind==='commission-proposals'?'Commission proposal published':'EU legislative document published',
   stageNote:feedKind==='commission-proposals'?'Proposal is not enacted law':'Publication does not establish a new vote or effective date',
   title:title.slice(0,360),date:d,sourceUrl:link,originalRecord:true,
   officialStatus:null,matchStatus:'Keyword matched; procedure linkage not confirmed'});
  if(results.length>=max)break;
 }
 return results;
}
export function relevantMilestones(items,query,days=30,now=Date.now()){
 const search=watchTerms(query).filter(w=>w.length>=3);
 const windowDays=Math.min(Math.max(Number(days)||30,7),90);
 const since=now-(windowDays+2)*86400000,until=now+windowDays*86400000;
 const generic=new Set(['kabinet','minister','ministerie','europese','european','commissie','commission','parlement','parliament','brussels','nederland','netherlands','regering','policy']);
 const matched=[];
 for(const item of items){
  const date=Date.parse(item.date),titleTerms=new Set(watchTerms(item.title));
  if(!Number.isFinite(date)||date<since||date>until)continue;
  const found=search.filter(x=>titleTerms.has(x));
  // One distinctive keyword suffices for a candidate; never claim exact legislative linkage.
  if(found.length<2&&!(found.length===1&&found[0].length>=7&&!generic.has(found[0])&&!/^\d+$/.test(found[0])))continue;
  matched.push({...item,matchingKeywords:found.slice(0,5),matchStatus:'Official record; topic relevance is an unverified keyword match'});
 }
 return matched.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,50);
}
async function requestText(url,signal){
 const response=await fetch(url,{signal,redirect:'follow',headers:{Accept:'application/json, application/rss+xml, application/xml, text/xml;q=0.8','User-Agent':'OpenLens/1.0 (public-affairs research)'}});
 if(!response.ok)throw Error('Upstream HTTP '+response.status);
 const announced=Number(response.headers.get('content-length')||0);
 if(announced>MAX_BODY)throw Error('Upstream document size exceeded');
 const text=await response.text();if(text.length>MAX_BODY)throw Error('Upstream document size exceeded');
 return text;
}
const sourceSpecs=[
 {name:'Dutch parliamentary activities',type:'Activiteit'},
 {name:'Dutch parliamentary cases',type:'Zaak'},
 {name:'Dutch parliamentary documents',type:'Document'},
 {name:'EUR-Lex Commission proposals',feed:'161',kind:'commission-proposals'},
 {name:'EUR-Lex legislation publications',feed:'162',kind:'eu-legislation'}
];
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');return res.end(JSON.stringify({error:'Use GET'}))}
 const p=new URL(req.url||'/','http://localhost').searchParams;
 const query=cleanWatchQuery(p.get('q'));
 if(!query){res.statusCode=400;return res.end(JSON.stringify({error:'Use at least two distinctive keywords.'}))}
 const days=['7','30','90'].includes(p.get('days'))?Number(p.get('days')):30;
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),9000);
 try{
  const sources=await Promise.all(sourceSpecs.map(async spec=>{
   try{
    const uri=spec.type?makeDutchUrl(spec.type,query,days):EU+spec.feed;
    const body=await requestText(uri,ctl.signal);
    const rows=spec.type?parseDutchOdata(JSON.parse(body),spec.type):parseEurlexRss(body,spec.kind);
    return {source:spec.name,status:'ok',count:rows.length,rows};
   }catch(e){return {source:spec.name,status:'unavailable',count:0,rows:[],reason:String(e?.message||'Source error').slice(0,90)}}
  }));
  const all=sources.flatMap(x=>x.rows),seen=new Set(),events=[];
  for(const row of relevantMilestones(all,query,days)){
   if(seen.has(row.id))continue;seen.add(row.id);events.push(row);
  }
  return res.end(JSON.stringify({
   query,checkedAt:new Date().toISOString(),events,sourceStatus:sources.map(({source,status,count,reason})=>({source,status,count,...(reason?{reason}:{})})),
   warning:'Only original-source records are shown. Candidate relevance is based on keyword overlap, not a verified link to the watched policy or proof of passage. Dutch activities, cases and documents are separate records; EU RSS covers proposal and legislative-document publications, not a complete procedure timeline. Sources may be delayed or inaccessible.'
  }));
 }finally{clearTimeout(timer)}
}
