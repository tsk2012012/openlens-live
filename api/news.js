import {parseRss,parseGdelt,gdeltUrl,feedsFor,isOnTopic,combineArticles} from './news-providers.js';
/* OpenLens optional same-origin news endpoint (Vercel-compatible, Node 20+).
 * No API key. Fetches Google News RSS and returns publisher attribution from
 * feed metadata; article links may pass through news.google.com.
 * This endpoint is not a fact checking or full-text extraction service.
 */
const topics = {
  all: '(world OR economy OR technology OR politics OR climate)',
  world: '(summit OR diplomacy OR conflict OR United Nations)',
  politics: '(election OR parliament OR minister OR government)',
  europe: '(European Union OR European Commission OR Brussels)',
  business: '(economy OR inflation OR interest rates OR trade)',
  technology: '(artificial intelligence OR technology OR cybersecurity)',
  climate: '(climate change OR clean energy OR emissions)',
  health: '(public health OR medical research OR healthcare)',
  migration: '(migration OR immigration OR asylum OR refugees OR border policy OR migratie OR asiel)',
  'dutch-politics': '("Tweede Kamer" OR "Nederlandse politiek" OR "Dutch parliament" OR "Dutch government" OR kabinet OR coalitie)',
  geopolitics: '("foreign policy" OR geopolitics OR diplomacy OR sanctions OR "international security")',
  gaza: '(Gaza OR Rafah OR "Gaza Strip" OR "Gaza ceasefire" OR "Gaza humanitarian aid")',
  ukraine: '(Ukraine OR Ukrainian OR Kyiv OR "Russia Ukraine" OR Zelensky)',
  'middle-east': '("Middle East" OR Israel OR Iran OR Lebanon OR Syria OR Gaza)',
  'eu-policy': '("European Union" OR "European Commission" OR "European Parliament" OR "EU policy")',
  "netherlands": "(\"Nederland\" OR \"Nederlandse samenleving\" OR \"rijksbeleid\" OR \"Den Haag\" OR \"Nederlandse economie\")",
  "dutch-politics": "(\"Tweede Kamer\" OR \"kabinet\" OR \"Eerste Kamer\" OR \"coalitie\" OR \"regeerakkoord\" OR \"ministerraad\")",
  "eu-institutions": "(\"Europese Commissie\" OR \"Europees Parlement\" OR \"Europese Raad\" OR \"EU besluitvorming\" OR \"EU institutions\")",
  "eu-policy": "(\"EU wetgeving\" OR \"Europese Commissie\" OR \"EU beleid\" OR \"EU regulation\" OR \"European Parliament\")",
  "housing": "(\"woningtekort\" OR \"woningbouw\" OR \"huurbeleid\" OR \"sociale huur\" OR \"housing Netherlands\")",
  "public-finances": "(\"rijksbegroting\" OR \"belastingplan\" OR \"koopkracht\" OR \"begrotingstekort\" OR \"ministerie van Financiën\")",
  "labor": "(\"arbeidsmarkt\" OR \"cao\" OR \"minimumloon\" OR \"flexwerk\" OR \"pensioenakkoord\" OR \"werkgelegenheid\")",
  "healthcare-nl": "(\"zorgverzekering\" OR \"zorgpremie\" OR \"ziekenhuiszorg\" OR \"huisarts\" OR \"zorgbeleid\")",
  "education": "(\"onderwijsbeleid\" OR \"studiefinanciering\" OR \"hoger onderwijs\" OR \"universiteiten Nederland\" OR \"lerarentekort\")",
  "agriculture": "(\"stikstofbeleid\" OR \"landbouw\" OR \"boeren\" OR \"natuurherstel\" OR \"mestbeleid\")",
  "climate-energy": "(\"energietransitie\" OR \"netcongestie\" OR \"klimaatbeleid\" OR \"windenergie\" OR \"energieprijzen\")",
  "mobility": "(\"openbaar vervoer\" OR \"NS\" OR \"spoor\" OR \"mobiliteitsbeleid\" OR \"infrastructuur\")",
  "digital-policy": "(\"AI Act\" OR \"digitale overheid\" OR \"privacywetgeving\" OR \"cybersecurity\" OR \"digitale autonomie\")",
  "local-government": "(\"gemeenteraad\" OR \"provinciale staten\" OR \"gemeentefinanciën\" OR \"lokale politiek\" OR \"decentralisatie\")",
  "rule-of-law": "(\"rechtsstaat\" OR \"rechtspraak\" OR \"grondrechten\" OR \"Raad van State\" OR \"democratische rechtsstaat\")",
  "security-defense": "(\"NAVO\" OR \"defensie\" OR \"Europese veiligheid\" OR \"NATO\" OR \"veiligheidsbeleid\")",
  "social-policy": "(\"sociale zekerheid\" OR \"armoede\" OR \"uitkeringen\" OR \"jeugdzorg\" OR \"sociale voorzieningen\")",
  "belgium-benelux": "(\"België\" OR \"Benelux\" OR \"Vlaanderen\" OR \"Brussel\" OR \"Nederland België\")"
};
const countryLang = {
  Netherlands: ['NL', 'nl', 'nl'],
  'United States': ['US', 'en-US', 'en'],
  'United Kingdom': ['GB', 'en-GB', 'en'],
  Germany: ['DE', 'de', 'de'],
  France: ['FR', 'fr', 'fr'],
  India: ['IN', 'en-IN', 'en'],
  Canada: ['CA', 'en-CA', 'en'],
  Australia: ['AU', 'en-AU', 'en'],
  Qatar: ['QA', 'ar', 'ar']
};
const langCode = {English:'en',Dutch:'nl',German:'de',French:'fr',Spanish:'es',Arabic:'ar'};
const langDisplay = {en:'English',nl:'Dutch',de:'German',fr:'French',es:'Spanish',ar:'Arabic'};
function extract(tag, input) {
  const found = input.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,'i'));
  return found ? decodeXml(found[1]) : '';
}
function decodeXml(input) {
  return String(input).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,p)=>{try {const n=p[0].toLowerCase()==='x'?parseInt(p.slice(1),16):parseInt(p,10);return String.fromCodePoint(n)}catch{return ''}})
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,a)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[a.toLowerCase()]));
}
export function extractFeedImage(block){
 const tags=[
  ...String(block||'').matchAll(/<(?:media:thumbnail|media:content|enclosure)\b[^>]*>/gi)
 ].map(m=>m[0]);
 for(const tag of tags){
  if(/<media:content/i.test(tag)&&/\bmedium=["'](?:audio|video)["']/i.test(tag))continue;
  if(/<enclosure/i.test(tag)&&!/\btype=["']image\//i.test(tag))continue;
  const raw=tag.match(/\burl=["']([^"']+)["']/i)?.[1];
  if(!raw)continue;
  const cleaned=decodeXml(raw);
  try{
   const url=new URL(cleaned);
   if(url.protocol!=='https:'||!url.hostname.includes('.')||url.username||url.password||url.href.length>1600)continue;
   if(/^(?:localhost|127\.|10\.|192\.168\.|0\.)|\.local$/i.test(url.hostname))continue;
   return url.href;
  }catch{}
 }
 return null;
}
function parseFeed(xml, edition, max=110, discovery='general') {
  const items=[];
  const seen=new Set();
  for(const found of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block=found[1];
    const sourceTag=block.match(/<source\b[^>]*>([\s\S]*?)<\/source>/i);
    const source=sourceTag?decodeXml(sourceTag[1]).trim():'';
    const rawTitle=extract('title',block).trim();
    const title=source && rawTitle.endsWith(' - '+source)?rawTitle.slice(0,-source.length-3):rawTitle;
    const url=extract('link',block).trim();
    const rawDate=extract('pubDate',block);
    const ms=Date.parse(rawDate);
    if(!title || !/^https?:\/\//.test(url) || seen.has(url))continue;
    seen.add(url);
    items.push({title,url,domain:source||'Unknown publisher',source:source||'Unknown publisher',imageUrl:extractFeedImage(block),imageAttribution:'Feed image (if available)',when:Number.isFinite(ms)?new Date(ms).toISOString():null,dateType:'feed_pubdate',language:langDisplay[edition[2]]||'Unknown',country:null,provider:'Google News RSS',sourceCountryUnknown:true,discovery});
    if(items.length>=max)break;
  }
  return items;
}
export default async function handler(req,res) {
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');return res.end('Method not allowed')}
 const p=new URL(req.url||'/', 'http://localhost').searchParams;
 const topic=Object.prototype.hasOwnProperty.call(topics,p.get('topic'))?p.get('topic'):'all';
 const country=p.get('country')||'all',language=p.get('language')||'all';
 const period=['1','7','30'].includes(p.get('period'))?p.get('period'):'7';
 const internationalTopics=new Set(['world','gaza','ukraine','middle-east','geopolitics']);
 const preferDutch=(country==='all'&&language==='all'&&!internationalTopics.has(topic));
 const edition=(countryLang[country]||(preferDutch?countryLang.Netherlands:['US','en-US','en'])).slice();
 if(langCode[language]){edition[2]=langCode[language];edition[1]=edition[2]==='en'?'en-'+edition[0]:edition[2]}
 const [countryCode,hl,lang]=edition;
 const feedUrl=(q,locale=edition)=>{
  const [cc,h,l]=locale,u=new URL('https://news.google.com/rss/search');
  u.searchParams.set('q',q);u.searchParams.set('hl',h);u.searchParams.set('gl',cc);u.searchParams.set('ceid',cc+':'+l);return u;
 };
 const baseQuery=topics[topic]+' when:'+period+'d';
 const searches=[{query:baseQuery,max:90,discovery:'general',locale:edition}];
 const dutchDiscovery=(country==='all'||country==='Netherlands')&&(language==='all'||language==='Dutch')&&
  !internationalTopics.has(topic);
 const europeDiscovery=(country==='all'||country==='Netherlands'||country==='United Kingdom')&&
  (language==='all'||language==='English');
 const siteGroup=(domains)=>'('+domains.map(d=>'site:'+d).join(' OR ')+')';
 if(dutchDiscovery){
  // Discovery—not a representative sample. Never infer a bias distribution from these counts.
  const national=['nos.nl','nrc.nl','volkskrant.nl','trouw.nl','telegraaf.nl','ad.nl','rtlnieuws.nl','nu.nl','fd.nl','bnr.nl'];
  const publicAffairs=['ftm.nl','binnenlandsbestuur.nl','decorrespondent.nl','groene.nl','limburger.nl','gld.nl','omroepbrabant.nl','rd.nl','dutchnews.nl','nltimes.nl'];
  searches.push({query:topics[topic]+' '+siteGroup(national)+' when:'+period+'d',max:38,discovery:'dutch-national-publishers',locale:countryLang.Netherlands});
  searches.push({query:topics[topic]+' '+siteGroup(publicAffairs)+' when:'+period+'d',max:38,discovery:'dutch-public-affairs-and-regional',locale:countryLang.Netherlands});
 }
 if(europeDiscovery){
  const euro=['politico.eu','euractiv.com','euobserver.com','euronews.com','brusselstimes.com','ft.com','dw.com','reuters.com','europeanconservative.com'];
  searches.push({query:topics[topic]+' '+siteGroup(euro)+' when:'+period+'d',max:35,discovery:'european-news-publishers',locale:['GB','en-GB','en']});
 }
 const publicDocuments=(country==='all'||country==='Netherlands')&&(language==='all'||language==='Dutch')&&
  !internationalTopics.has(topic);
 if(publicDocuments){
  const official=['rijksoverheid.nl','tweedekamer.nl','cbs.nl','rekenkamer.nl','ec.europa.eu','europarl.europa.eu','consilium.europa.eu'];
  searches.push({query:topics[topic]+' '+siteGroup(official)+' when:'+period+'d',max:24,discovery:'official-institutional-sources',locale:countryLang.Netherlands});
 }
 const usSupplement=(country==='United States')&&(language==='all'||language==='English');
 if(usSupplement){
  for(const [index,domains] of [
   ['foxnews.com','nypost.com','newsmax.com','washingtonexaminer.com','dailywire.com'],
   ['nationalreview.com','washingtontimes.com','thedispatch.com','breitbart.com','thefederalist.com']
  ].entries())searches.push({query:topics[topic]+' '+siteGroup(domains)+' when:'+period+'d',
   max:35,discovery:'supplemental-us-right-'+(index+1),locale:countryLang['United States']});
 }
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=600, stale-while-revalidate=1800');
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),12500);
 try{
  const publisherFeeds=feedsFor(topic,country,language);
  const jobs=[
   ...searches.map(async s=>{
    const r=await fetch(feedUrl(s.query,s.locale),{signal:ctl.signal,headers:{'User-Agent':'OpenLensDemo/1.0 (noncommercial feed browser)'}});
    if(!r.ok)throw Error('Google News HTTP '+r.status);
    return {source:'Google News RSS',name:s.discovery,articles:parseFeed(await r.text(),s.locale,s.max,s.discovery)};
   }),
   ...publisherFeeds.map(async spec=>{
    const r=await fetch(spec.url,{signal:ctl.signal,headers:{'User-Agent':'OpenLens/1.0 (news research)'}});
    if(!r.ok)throw Error('Original publisher RSS HTTP '+r.status);
    const xml=await r.text();if(xml.length>1200000)throw Error('Original publisher RSS too large');
    return {source:'Publisher RSS',name:spec.name,articles:parseRss(xml,spec,Number(period)).filter(a=>isOnTopic(a.title,topic))};
   }),
   (async()=>{
    const r=await fetch(gdeltUrl(topic,period),{signal:ctl.signal,headers:{'User-Agent':'OpenLens/1.0 (news research)'}});
    if(!r.ok)throw Error('GDELT HTTP '+r.status);
    const text=await r.text();if(text.length>2000000)throw Error('GDELT feed too large');
    return {source:'GDELT DOC 2.0',name:'GDELT',articles:parseGdelt(JSON.parse(text))};
   })()
  ];
  const results=await Promise.allSettled(jobs);
  const discovered=[],sourceHealth=[],discoveryCounts={};
  const sampleCounts={general:0,publisherDiscovery:0,primaryDocuments:0,supplementalUS:0,originalRss:0,gdelt:0};
  for(let i=0;i<results.length;i++){
   const r=results[i];
   if(r.status!=='fulfilled'){
    sourceHealth.push({source:i<searches.length?'Google News RSS':i<searches.length+publisherFeeds.length?'Publisher RSS':'GDELT DOC 2.0',status:'unavailable'});
    continue;
   }
   const batch=r.value;
   sourceHealth.push({source:batch.source,name:batch.name,status:'ok',count:batch.articles.length});
   for(const article of batch.articles){
    discovered.push(article);
    const discovery=article.discovery;
    discoveryCounts[discovery]=(discoveryCounts[discovery]||0)+1;
    if(discovery==='general')sampleCounts.general++;
    else if(discovery==='official-institutional-sources')sampleCounts.primaryDocuments++;
    else if(discovery.startsWith('supplemental-us'))sampleCounts.supplementalUS++;
    else if(discovery==='publisher-rss')sampleCounts.originalRss++;
    else if(discovery==='gdelt-index')sampleCounts.gdelt++;
    else sampleCounts.publisherDiscovery++;
   }
  }
  const articles=combineArticles(discovered).slice(0,360);
  if(!articles.length)throw Error('Feeds returned no articles');
  // A source-targeted supplement increases discovery opportunities, not political representativeness.
  res.statusCode=200;
  return res.end(JSON.stringify({
   articles,provider:'Google News RSS, original publisher RSS and GDELT (when available)',sourceHealth,queryTopic:topic,edition:{country:countryCode,language:lang},
   fetchedAt:new Date().toISOString(),sampleCounts,discoveryCounts,
   discoveryMode:searches.length>1?'general-plus-labelled-source-discovery':'general-only',
   warning:'Google News, original publisher feeds and independent GDELT discovery are overlapping, incomplete nonrepresentative samples. Search selection is not a balanced political sample. Institutional publications are not independent newsroom reporting, and publisher ratings cannot verify article accuracy.'
  }));
 }catch(err){res.statusCode=503;return res.end(JSON.stringify({error:'Live headlines unavailable',detail:String(err.message||err)}))}
 finally{clearTimeout(timeout)}
}
