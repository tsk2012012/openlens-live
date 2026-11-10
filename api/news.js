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
  health: '(public health OR medical research OR healthcare)'
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
    items.push({title,url,domain:source||'Unknown publisher',source:source||'Unknown publisher',when:Number.isFinite(ms)?new Date(ms).toISOString():null,dateType:'feed_pubdate',language:langDisplay[edition[2]]||'Unknown',country:null,provider:'Google News RSS',sourceCountryUnknown:true,discovery});
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
 const edition=(countryLang[country]||['US','en-US','en']).slice();
 if(langCode[language]){edition[2]=langCode[language];edition[1]=edition[2]==='en'?'en-'+edition[0]:edition[2]}
 const [countryCode,hl,lang]=edition;
 const feedUrl=q=>{const u=new URL('https://news.google.com/rss/search');u.searchParams.set('q',q);u.searchParams.set('hl',hl);u.searchParams.set('gl',countryCode);u.searchParams.set('ceid',countryCode+':'+lang);return u};
 const searches=[{query:topics[topic]+' when:'+period+'d',max:110,discovery:'general'}];
 const supplement=(country==='all'||country==='United States')&&(language==='all'||language==='English');
 if(supplement){
  const groups=[
   ['foxnews.com','nypost.com','newsmax.com','washingtonexaminer.com','dailywire.com'],
   ['nationalreview.com','washingtontimes.com','thedispatch.com','breitbart.com','thefederalist.com']
  ];
  groups.forEach((ds,i)=>searches.push({query:topics[topic]+' ('+ds.map(d=>'site:'+d).join(' OR ')+') when:'+period+'d',max:45,discovery:'supplemental-right-'+(i+1)}));
 }
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=600, stale-while-revalidate=1800');
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),8500);
 try{
  const results=await Promise.allSettled(searches.map(async s=>{
   const r=await fetch(feedUrl(s.query),{signal:ctl.signal,headers:{'User-Agent':'OpenLensDemo/1.0 (non-commercial headline review)'}});
   if(!r.ok)throw new Error('Upstream HTTP '+r.status);
   return parseFeed(await r.text(),edition,s.max,s.discovery);
  }));
  const seen=new Set(),articles=[],sampleCounts={general:0,supplemental:0};
  for(const r of results){if(r.status!=='fulfilled')continue;for(const a of r.value){if(seen.has(a.url))continue;seen.add(a.url);articles.push(a);if(a.discovery==='general')sampleCounts.general++;else sampleCounts.supplemental++}}
  if(!articles.length)throw new Error('Feeds returned no articles');
  res.statusCode=200;
  return res.end(JSON.stringify({
   articles,provider:'Google News RSS',edition:{country:countryCode,language:lang},
   fetchedAt:new Date().toISOString(),sampleCounts,
   discoveryMode:supplement?'general-plus-right-source-discovery':'general-only',
   warning:'This is a nonrepresentative sample. Supplemental US/English source-targeted searches discover more right-rated publishers. Publisher ratings do not verify individual reports.'
  }));
 }catch(err){res.statusCode=503;return res.end(JSON.stringify({error:'Live headlines unavailable',detail:String(err.message||err)}))}
 finally{clearTimeout(timeout)}
}
