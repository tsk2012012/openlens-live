/* Provenance-aware discovery from primary publisher RSS and GDELT DOC 2.0. */
const publishers={'nos.nl':'NOS','nu.nl':'NU','politico.eu':'POLITICO.eu','euractiv.com':'EURACTIV','telegraaf.nl':'De Telegraaf','volkskrant.nl':'de Volkskrant','nrc.nl':'NRC','ad.nl':'AD.nl','trouw.nl':'Trouw','reuters.com':'Reuters','theguardian.com':'The Guardian','euobserver.com':'EUobserver','euronews.com':'Euronews'};
export function safeLink(raw){
 try{const u=new URL(raw),h=u.hostname.toLowerCase();return u.protocol==='https:'&&h.includes('.')&&!u.username&&!u.password&&(!u.port||u.port==='443')&&u.href.length<2000&&!/^(?:localhost|127\.|10\.|192\.168\.|0\.)|\.local$|\.internal$/i.test(h)?u.href:null}catch{return null}
}
export function publisherFor(v){
 try{let host=(String(v).includes('://')?new URL(v).hostname:String(v)).toLowerCase().replace(/^www\./,'');
 const p=Object.keys(publishers).find(d=>host===d||host.endsWith('.'+d));return p?publishers[p]:host}
 catch{return 'Unknown publisher'}
}
const decode=x=>String(x||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi,'$1').replace(/<[^>]+>/g,' ').replace(/&#(\d+);/g,(_,n)=>{try{return String.fromCodePoint(Number(n))}catch{return ''}}).replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[n.toLowerCase()])).trim();
const text=(tag,xml)=>decode(String(xml).match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+tag+'>','i'))?.[1]||'');
export function parseRss(xml,spec,days=7,now=Date.now()){
 const out=[],cutoff=now-(Number(days)+1)*86400000,seen=new Set();
 for(const match of String(xml||'').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const block=match[1],title=text('title',block).slice(0,350),url=safeLink(text('link',block)),date=Date.parse(text('pubDate',block)||text('dc:date',block));
  if(!url||!title||!Number.isFinite(date)||date<cutoff||seen.has(url))continue;
  if(!spec.domains.some(d=>{const h=new URL(url).hostname;return h===d||h.endsWith('.'+d)}))continue;
  seen.add(url);
  let image=null;
  for(const tag of block.matchAll(/<(?:media:thumbnail|media:content|enclosure)\b[^>]*>/gi)){
   if(/<enclosure/i.test(tag[0])&&!/\btype=["']image\//i.test(tag[0]))continue;
   const raw=tag[0].match(/\burl=["']([^"']+)["']/i)?.[1]||'';
   image=safeLink(decode(raw));if(image)break;
  }
  out.push({title,url,source:spec.name,domain:spec.name,when:new Date(date).toISOString(),dateType:'publisher_pubdate',
    imageUrl:image,imageAttribution:image?'Original publisher feed':null,language:spec.language,
    country:null,provider:'Original publisher RSS',discovery:'publisher-rss'});
  if(out.length>=55)break;
 }
 return out;
}
export function parseGdelt(data){
 const out=[],seen=new Set();
 for(const a of Array.isArray(data?.articles)?data.articles:[]){
  const url=safeLink(a.url),title=String(a.title||'').trim().slice(0,350),date=String(a.seendate||'');
  const d=/^\d{8}T\d{6}Z$/.test(date)?date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)+'T'+date.slice(9,11)+':'+date.slice(11,13)+':'+date.slice(13,15)+'Z':date;
  const timestamp=Date.parse(d);
  if(!url||!title||!Number.isFinite(timestamp)||seen.has(url))continue;
  seen.add(url);const source=publisherFor(a.domain||url),imageUrl=safeLink(a.socialimage);
  out.push({url,title,source,domain:source,when:new Date(timestamp).toISOString(),dateType:'index_seen_time',language:a.language||'Unknown',
   country:null,imageUrl,imageAttribution:imageUrl?'Indexed social image':null,
   provider:'GDELT DOC 2.0',discovery:'gdelt-index'});
  if(out.length>=85)break;
 }
 return out;
}
export function gdeltUrl(topic,days=7){
 const qs={'all':'(Netherlands OR Europe)','netherlands':'Netherlands','dutch-politics':'Netherlands parliament','housing':'Netherlands housing',
  'eu-policy':'"European Union" policy','eu-institutions':'"European Commission"','migration':'Europe migration',
  'public-finances':'Netherlands budget','local-government':'Netherlands municipality','gaza':'Gaza','ukraine':'Ukraine',
  'europe':'Europe politics'};
 const query=qs[topic]||'Netherlands '+String(topic).replace(/[^a-z -]/gi,' ').slice(0,25);
 const u=new URL('https://api.gdeltproject.org/api/v2/doc/doc');
 for(const [k,v] of Object.entries({query,mode:'ArtList',format:'json',sort:'DateDesc',maxrecords:'85',timespan:['1','7','30'].includes(String(days))?days+'d':'7d'}))u.searchParams.set(k,v);
 return u.href;
}
export function feedsFor(topic,country='all',language='all'){
 if(!['all','Netherlands'].includes(country))return [];
 const feeds=[];
 if(['all','Dutch'].includes(language)){
  if(['all','netherlands','dutch-politics','migration','public-finances','local-government'].includes(topic))
   feeds.push({name:'NOS',language:'Dutch',url:'https://feeds.nos.nl/nosnieuwspolitiek',domains:['nos.nl']});
  if(['all','netherlands','housing','migration','education','healthcare-nl','social-policy','climate-energy'].includes(topic))
   feeds.push({name:'NOS',language:'Dutch',url:'https://feeds.nos.nl/nosnieuwsbinnenland',domains:['nos.nl']});
  if(['all','netherlands','dutch-politics','public-finances'].includes(topic))
   feeds.push({name:'NU',language:'Dutch',url:'https://www.nu.nl/rss/Politiek',domains:['nu.nl']});
 }
 if(['all','Dutch'].includes(language)){
  const general=['all','netherlands','dutch-politics','eu-policy','migration','housing','public-finances','local-government'];
  if(general.includes(topic)){
   feeds.push({name:'NRC',language:'Dutch',url:'https://www.nrc.nl/rss/',domains:['nrc.nl']});
   feeds.push({name:'De Telegraaf',language:'Dutch',url:'https://www.telegraaf.nl/rss',domains:['telegraaf.nl']});
   feeds.push({name:'de Volkskrant',language:'Dutch',url:'https://www.volkskrant.nl/voorpagina/rss',domains:['volkskrant.nl']});
   feeds.push({name:'Trouw',language:'Dutch',url:'https://www.trouw.nl/voorpagina/rss.xml',domains:['trouw.nl']});
   feeds.push({name:'AD.nl',language:'Dutch',url:'https://www.ad.nl/home/rss.xml',domains:['ad.nl']});
  }
 }
 if(['all','English'].includes(language)&&['all','europe','eu-policy','eu-institutions','migration','geopolitics'].includes(topic)){
  feeds.push({name:'POLITICO.eu',language:'English',url:'https://www.politico.eu/feed/',domains:['politico.eu']});
  feeds.push({name:'DutchNews.nl',language:'English',url:'https://www.dutchnews.nl/feed/',domains:['dutchnews.nl']});
  feeds.push({name:'NL Times',language:'English',url:'https://nltimes.nl/feed',domains:['nltimes.nl']});
 }
 return feeds.slice(0,11);
}
export function isOnTopic(title,topic){
 const terms={'dutch-politics':/kabinet|kamer|minister|coalitie|verkiez|parlement|politiek|begroting/i,housing:/woning|bouw|huur|housing/i,migration:/migr|asiel|vluchteling|refugee/i,
  'public-finances':/belasting|begroting|budget|financ/i,'local-government':/gemeent|provinc|lokaal/i,
  education:/onderwijs|school|student|universit/i,'healthcare-nl':/zorg|hospital|ziekenhuis/i,
  'social-policy':/armoede|sociaal|uitkering|social/i,'climate-energy':/klimaat|energie|stroom|netcongestie/i,
  'eu-policy':/europ|brussel|commissie|\bEU\b/i,'eu-institutions':/europ|brussel|commissie|\bEU\b/i};
 return !terms[topic]||terms[topic].test(title);
}
export function combineArticles(items){
 const seenUrl=new Map(),seenTitle=new Set(),out=[];
 for(const a of items){
  const url=safeLink(a.url);if(!url)continue;
  const u=new URL(url);for(const k of [...u.searchParams.keys()])if(/^utm_|^(fbclid|gclid|ref)$/i.test(k))u.searchParams.delete(k);
  const key=u.href.replace(/\/$/,'');
  const name=(a.source||'').toLowerCase(),title=(a.title||'').trim().toLowerCase().replace(/\s+/g,' ');
  const titleKey=name+'|'+title;
  if(seenUrl.has(key)){const old=seenUrl.get(key);if(!old.imageUrl&&a.imageUrl)old.imageUrl=a.imageUrl;continue}
  if(seenTitle.has(titleKey))continue;
  seenUrl.set(key,a);seenTitle.add(titleKey);out.push(a);
 }
 return out;
}
