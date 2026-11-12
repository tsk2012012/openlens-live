/* Sourced publisher identity layer: exact aliases and publisher-owned domains only.
 * Does not derive bias, factual accuracy or political ideology from ownership. */
(function(root){
'use strict';
const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]+/g,' ').trim();
const aliasIndex=new Map(),domainIndex=new Map();
let profiles=[],loaded=false;
function safeHost(value){
 try{
  const s=String(value||'').trim(),host=/^https?:\/\//i.test(s)?new URL(s).hostname:
    /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)?s:null;
  return host?.toLowerCase().replace(/^www\./,'')||null;
 }catch{return null}
}
function lookup(value){
 const item=typeof value==='object'&&value?value:null;
 const names=item?[item.source,item.domain,item.publisher,item.name]:[value];
 for(const raw of names){
  const key=normalize(raw);
  if(key&&aliasIndex.has(key))return aliasIndex.get(key);
  const host=safeHost(raw);
  if(host&&domainIndex.has(host))return domainIndex.get(host);
 }
 const host=item?safeHost(item.url):null;
 if(host&&host!=='news.google.com'&&domainIndex.has(host))return domainIndex.get(host);
 return null;
}
const api={lookup,canonical(value){return lookup(value)?.name||String(value?.source||value?.name||value||'')},
 get profiles(){return profiles.slice()},get loaded(){return loaded},count(){return profiles.length},
 normalize};
root.OpenLensPublisherProfiles=api;
fetch('/publisher-profiles.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('publisher_profiles_missing');return r.json()})
.then(d=>{
 const rows=Array.isArray(d.profiles)?d.profiles:[];
 for(const raw of rows){
  if(!raw||!raw.name||typeof raw.id!=='string'||!Array.isArray(raw.domains))continue;
  const profile=Object.freeze({...raw,politicalRating:null});
  profiles.push(profile);
  for(const name of [raw.name,...(raw.aliases||[])]){
   const key=normalize(name);
   if(key&&!aliasIndex.has(key))aliasIndex.set(key,profile);
  }
  for(const domain of raw.domains){
   const host=safeHost(domain);
   if(host&&!domainIndex.has(host))domainIndex.set(host,profile);
  }
 }
 loaded=true;
 if(typeof document!=='undefined')document.dispatchEvent(new Event('openlens:profiles-ready'));
}).catch(()=>{loaded=false});
})(typeof window==='undefined'?globalThis:window);
