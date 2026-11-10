/**
 * OpenLens article preview (no AI key, no article text storage).
 * Fetches public publisher metadata and, where possible, a short lead from article HTML.
 * Do not confuse metadata/lead excerpts with a verified full-article summary.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import {googleNewsArticleId,resolveGoogleNewsUrl} from './google-news-resolver.js';

const MAX_HTML = 850_000;
const TIMEOUT = 2800;
const RESOLVE_TIMEOUT = 3900;
const AGENT = 'OpenLensPreview/1.0 (+non-commercial metadata preview)';

export function isPublicIP(ip) {
  if (!ip) return false;
  const v = ip.toLowerCase().split('%')[0];
  if (v.startsWith('::ffff:')) return isPublicIP(v.slice(7));
  if (isIP(v) === 4) {
    const p = v.split('.').map(Number);
    return !(p[0]===0 || p[0]===10 || p[0]===127 || p[0]>=224 ||
      p[0]===169&&p[1]===254 || p[0]===172&&p[1]>=16&&p[1]<=31 ||
      p[0]===192&&p[1]===168 || p[0]===100&&p[1]>=64&&p[1]<=127 ||
      p[0]===192&&p[1]===0 || p[0]===192&&p[1]===0&&p[2]===2 ||
      p[0]===198&&(p[1]===18||p[1]===19||p[1]===51) ||
      p[0]===203&&p[1]===0&&p[2]===113);
  }
  if (isIP(v)===6) return !(v==='::' || v==='::1' || v.startsWith('fc') ||
    v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') ||
    v.startsWith('fea') || v.startsWith('feb') || v.startsWith('ff') ||
    v.startsWith('2001:db8:'));
  return false;
}

async function checkedUrl(input) {
  const url = new URL(input);
  const host = url.hostname.toLowerCase();
  if (url.protocol!=='https:' || url.username || url.password || (url.port&&url.port!=='443') ||
      !host.includes('.') || host.length>253 || isIP(host) ||
      /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host) ||
      /(^|\.)(localhost|local|internal|test|invalid|example)\./.test(host)) {
    throw new Error('Only public HTTPS publisher links are supported.');
  }
  const addresses = await lookup(host,{all:true});
  if (!addresses.length || addresses.some(x=>!isPublicIP(x.address))) throw new Error('Publisher address is not public.');
  return url;
}

async function getHtml(target) {
  let url=target;
  for(let redirect=0;redirect<4;redirect++){
    const safe=await checkedUrl(url);
    const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),TIMEOUT);
    let response;
    try { response=await fetch(safe,{redirect:'manual',signal:ctl.signal,headers:{Accept:'text/html,application/xhtml+xml', 'User-Agent':AGENT}}); }
    catch(err){clearTimeout(t);throw err}
    if([301,302,303,307,308].includes(response.status)){
      const next=response.headers.get('location');
      clearTimeout(t);
      if(!next)throw new Error('Publisher redirect is incomplete.');
      url=new URL(next,safe).href;
      continue;
    }
    if(!response.ok){clearTimeout(t);throw new Error('Publisher page unavailable ('+response.status+').');}
    const type=(response.headers.get('content-type')||'').toLowerCase();
    if(!type.includes('text/html') && !type.includes('application/xhtml+xml')){clearTimeout(t);throw new Error('Publisher did not return an HTML article.');}
    if(Number(response.headers.get('content-length')||0)>MAX_HTML){clearTimeout(t);throw new Error('Article page exceeds preview size limit.');}
    const chunks=[];let length=0;
    // Bound downloaded HTML even if Content-Length is omitted.
    if(response.body){
      for await(const chunk of response.body){length+=chunk.byteLength;if(length>MAX_HTML)throw new Error('Article HTML exceeds preview limit.');chunks.push(chunk)}
      clearTimeout(t);return {html:Buffer.concat(chunks).toString('utf8'),url:response.url||safe.href};
    }
    const html=await response.text();
    if(html.length>MAX_HTML)throw new Error('Article HTML exceeds preview limit.');
    clearTimeout(t);return {html,url:safe.href};
  }
  throw new Error('Too many publisher redirects.');
}

function decodeHtml(text){return String(text||'').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|ldquo|rdquo|ndash|mdash|hellip);/gi,(m,x)=>{
  const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',ndash:'–',mdash:'—',hellip:'…'};
  if(x[0]==='#'){const n=x[1]?.toLowerCase()==='x'?parseInt(x.slice(2),16):Number(x.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):' '}
  return entities[x.toLowerCase()]||m;
})}
const cleanText=t=>decodeHtml(String(t||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ')).replace(/\s+/g,' ').trim();
function attr(tag,name){const m=tag.match(new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return m?decodeHtml(m[1]||m[2]||m[3]||''):''}
function metas(html){const result={};const tags=html.match(/<meta\b[^>]*>/gi)||[];
for(const tag of tags){const key=(attr(tag,'property')||attr(tag,'name')||'').toLowerCase();const content=attr(tag,'content');if(key&&content&&!result[key])result[key]=content}return result}
function structured(html){const values=[];const scripts=html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for(const match of scripts){try{let node=JSON.parse(match[1]);const visit=(x,depth=0)=>{if(depth>6||!x||typeof x!=='object')return;if(Array.isArray(x)){x.forEach(y=>visit(y,depth+1));return}const types=[].concat(x['@type']||[]).join(' ');if(/\b(NewsArticle|Article|ReportageNewsArticle|AnalysisNewsArticle)\b/i.test(types))values.push(x);if(x['@graph'])visit(x['@graph'],depth+1)};visit(node)}catch{}}
return values.sort((a,b)=>String(b.articleBody||'').length-String(a.articleBody||'').length)[0]||{}}
function shortWords(value,max=45){const clean=cleanText(value);const words=clean.split(/\s+/).filter(Boolean);return words.slice(0,max).join(' ')+(words.length>max?'…':'')}
function articleLead(html){
  // Prefer an actual <article> section; generic <main> can be mostly navigation.
  const region=html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]||'';
  if(!region)return '';
  const core=region.replace(/<(script|style|nav|footer|aside|form|button)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
  const paragraphs=[...core.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(x=>cleanText(x[1]));
  return paragraphs.find(x=>x.length>=95&&x.length<=1400&&!/cookies|subscribe now|sign up|advertisement|privacy policy|all rights reserved/i.test(x))||'';
}
export function makePreview(html,url){const meta=metas(html),data=structured(html);
const title=cleanText(data.headline||meta['og:title']||meta['twitter:title']||html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'');
const publisherDescription=cleanText(data.description||meta['description']||meta['og:description']||meta['twitter:description']||'');
const ldBody=typeof data.articleBody==='string'?cleanText(data.articleBody):'';
const lead=ldBody.slice(0,1800)||articleLead(html);
const descriptionValid=publisherDescription.length>=65&&publisherDescription.length<=1600;
const leadValid=lead.length>=90;
const synopsis=descriptionValid?shortWords(publisherDescription,42):leadValid?shortWords(lead,42):null;
const highlights=[];
if(descriptionValid)highlights.push({label:'Publisher description',text:shortWords(publisherDescription,35)});
const normalizeWords=s=>String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
if(leadValid && (!descriptionValid || !normalizeWords(lead).includes(normalizeWords(publisherDescription).slice(0,75))))
  highlights.push({label:'Accessible article lead',text:shortWords(lead,35)});
const source=descriptionValid?'Publisher description':leadValid?'Extracted article lead':null;
const date=String(data.datePublished||meta['article:published_time']||meta['datepublished']||'');
return {title:title.slice(0,240)||null,sourceUrl:url,synopsis,highlights,summarySource:source,
  publishedAt:date&&Number.isFinite(Date.parse(date))?new Date(date).toISOString():null,
  fullArticleRead:false,
  notice:source==='Publisher description'?'Publisher-supplied synopsis. May not reflect the full article.':source==='Extracted article lead'?'Short excerpt from an accessible article lead; not a complete summary.':'No reliable article description or readable lead was found. Open the publisher page.'};
}

export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=1200, stale-while-revalidate=2400');
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');return res.end(JSON.stringify({error:'Use GET'}))}
 const params=new URL(req.url||'/','http://localhost').searchParams;
 const input=params.get('url');
 if(!input||input.length>1800){res.statusCode=400;return res.end(JSON.stringify({error:'Missing or oversized article URL.'}))}
 let parsed;
 try{parsed=new URL(input)}catch{res.statusCode=400;return res.end(JSON.stringify({error:'Invalid article URL.'}))}
 if(parsed.protocol!=='https:'||parsed.username||parsed.password){
  res.statusCode=400;return res.end(JSON.stringify({error:'Only public HTTPS article URLs are supported.'}))
 }
 const isGoogle=parsed.hostname.toLowerCase()==='news.google.com';
 if(isGoogle&&!googleNewsArticleId(input)){
  res.statusCode=400;return res.end(JSON.stringify({error:'Unsupported Google News link format.'}))
 }
 const fallback=(originalUrl,reason,method)=>({
   title:null,sourceUrl:originalUrl||input,originalUrl:originalUrl||null,
   googleNewsUrl:isGoogle?input:null,synopsis:null,highlights:[],summarySource:null,
   publishedAt:null,fullArticleRead:false,
   resolutionStatus:originalUrl?'publisher-link-resolved':'unavailable',
   resolutionMethod:method||null,
   notice:reason
 });
 let url=input,method=isGoogle?'google-news-rpc':'direct-publisher';
 if(isGoogle){
  try{
   const result=await resolveGoogleNewsUrl(input,{timeoutMs:RESOLVE_TIMEOUT});
   url=result.originalUrl;method=result.method;
  }catch{
   res.statusCode=200;
   return res.end(JSON.stringify(fallback(null,
      'The Google News link could not be resolved to the publisher right now. The headline is not an article summary. Open Google News to continue to the article.',null)));
  }
 }
 try{
  const article=await getHtml(url);
  const info=makePreview(article.html,article.url);
  res.statusCode=200;
  return res.end(JSON.stringify({...info,
   originalUrl:article.url,googleNewsUrl:isGoogle?input:null,
   resolutionStatus:isGoogle?'resolved':'direct',
   resolutionMethod:method,
   notice:info.notice+' The publisher page was fetched for this preview; article content was not independently fact-checked.'}));
 }catch{
  res.statusCode=200;
  return res.end(JSON.stringify(fallback(url,
   'The original publisher link was located, but its content is blocked, paywalled or unavailable. Open the publisher page to read it.',
   method)));
 }
}
