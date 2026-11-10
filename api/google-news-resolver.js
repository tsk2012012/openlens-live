/* OpenLens: on-demand Google News redirect resolution.
 * Google uses an undocumented RPC; failures degrade to a Google News link.
 * Not a crawler: resolves only user-selected articles, not the whole feed.
 */
import { isIP } from 'node:net';
const ARTICLE_PATH=/^\/(?:rss\/)?(?:articles|read)\/([A-Za-z0-9_-]{20,600})\/?$/;
const RPC='https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je';
const UA='Mozilla/5.0 (compatible; OpenLens/1.0; article-attribution)';
const MAX_RESPONSE=1_500_000;
export function googleNewsArticleId(input){
 try{const u=new URL(input);return u.protocol==='https:'&&u.hostname.toLowerCase()==='news.google.com'
  ?u.pathname.match(ARTICLE_PATH)?.[1]||null:null}catch{return null}
}
export function googleDecodeParams(html){
 const sg=html.match(/\bdata-n-a-sg=(["'])(.*?)\1/i)?.[2],ts=html.match(/\bdata-n-a-ts=(["'])(\d+)\1/i)?.[2];
 return sg&&ts&&sg.length<300&&Number.isSafeInteger(Number(ts))?{sg,ts:Number(ts)}:null;
}
export function googleRpcBody(id,{sg,ts}){
 const req=['garturlreq',[['X','X',['X','X'],null,null,1,1,'US:en',null,1,null,null,null,null,null,0,1],'X','X',1,[1,1,1],1,1,null,0,0,null,0],id,ts,sg];
 return new URLSearchParams({'f.req':JSON.stringify([[['Fbv4je',JSON.stringify(req),null,'generic']]])}).toString();
}
export function parseGoogleRpc(text){
 for(const line of String(text||'').split(/\r?\n/)){
  if(!line.startsWith('[['))continue;
  try{
   const rows=JSON.parse(line);
   for(const row of rows){
    if(row?.[1]!=='Fbv4je'||typeof row[2]!=='string')continue;
    const value=JSON.parse(row[2]);
    if(value?.[0]==='garturlres'&&typeof value[1]==='string')return value[1];
   }
  }catch{}
 }
 return null;
}
function publisherUrl(input){
 try{
  const u=new URL(input);
  if(u.protocol!=='https:'||!u.hostname.includes('.')||u.username||u.password||u.port&&u.port!=='443'||isIP(u.hostname)||/(^|\.)(localhost|internal|local|test|invalid)$/i.test(u.hostname))return null;
  if(/(^|\.)google\.com$/i.test(u.hostname))return null;
  return u.href;
 }catch{return null}
}
async function limitedText(response,cap=MAX_RESPONSE){
 const declared=Number(response.headers.get('content-length')||0);
 if(declared>cap)throw new Error('Source HTML exceeds size limit');
 const chunks=[];let size=0;
 if(response.body){
  try{
   for await(const chunk of response.body){
    size+=chunk.byteLength;if(size>cap)throw new Error('Source HTML exceeds size limit');
    chunks.push(chunk);
   }
  }finally{if(!response.body.locked)await response.body.cancel().catch(()=>{})}
  return Buffer.concat(chunks).toString('utf8');
 }
 const text=await response.text();if(Buffer.byteLength(text)>cap)throw new Error('Source HTML exceeds size limit');
 return text;
}
async function googleFetch(url,opts,fetchImpl,signal,timeoutMs){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeoutMs);
 const onAbort=()=>ctl.abort();
 if(signal?.aborted)ctl.abort();else signal?.addEventListener('abort',onAbort,{once:true});
 try{
  const response=await fetchImpl(url,{...opts,redirect:'manual',signal:ctl.signal,
   headers:{'User-Agent':UA,Accept:'text/html,application/json,text/plain',
    'Accept-Language':'en-US,en;q=0.9',...opts.headers}});
  return {response,text:response.ok?await limitedText(response):''};
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',onAbort)}
}
/** Resolve an article link on user request, without bulk decoding. */
export async function resolveGoogleNewsUrl(input,{fetchImpl=fetch,signal,timeoutMs=4500}={}){
 const id=googleNewsArticleId(input);
 if(!id)throw new Error('Not a supported Google News article URL');
 const articleUrl='https://news.google.com/rss/articles/'+encodeURIComponent(id);
 let first,location=articleUrl,redirectCount=0;
 for(;redirectCount<5;redirectCount++){
  first=await googleFetch(location,{method:'GET'},fetchImpl,signal,timeoutMs);
  const moved=first.response.headers.get('location');
  if([301,302,303,307,308].includes(first.response.status)&&moved){
   const next=new URL(moved,location);
   const publisher=publisherUrl(next.href);
   if(publisher)return {originalUrl:publisher,method:'direct-redirect'};
   if(next.protocol!=='https:'||next.hostname!=='news.google.com')
    throw new Error('Google News requested an external sign-in or consent page');
   location=next.href;continue;
  }
  break;
 }
 if(redirectCount===5)throw new Error('Google News redirect chain exceeded limit');
 if(!first.response.ok)throw new Error('Google News page HTTP '+first.response.status);
 const params=googleDecodeParams(first.text);
 if(!params)throw new Error('Google News did not provide redirect metadata');
 const second=await googleFetch(RPC,{method:'POST',body:googleRpcBody(id,params),
  headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}},fetchImpl,signal,timeoutMs);
 if(!second.response.ok)throw new Error('Google News link resolution unavailable');
 const originalUrl=publisherUrl(parseGoogleRpc(second.text));
 if(!originalUrl)throw new Error('Google News response contained no publisher HTTPS URL');
 return {originalUrl,method:'google-news-rpc'};
}
