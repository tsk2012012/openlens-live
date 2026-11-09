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
function parseFeed(xml, edition) {
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
    items.push({title,url,domain:source||'Unknown publisher',source:source||'Unknown publisher',when:Number.isFinite(ms)?new Date(ms).toISOString():null,dateType:'feed_pubdate',language:langDisplay[edition[2]]||'Unknown',country:null,provider:'Google News RSS',sourceCountryUnknown:true});
    if(items.length>=110)break;
  }
  return items;
}
export default async function handler(req,res) {
  if(req.method !== 'GET') {res.statusCode=405;res.setHeader('Allow','GET');return res.end('Method not allowed')}
  const params=new URL(req.url||'/', 'http://localhost').searchParams;
  const topic=topics[params.get('topic')]?params.get('topic'):'all';
  const country=params.get('country')||'all';
  const language=params.get('language')||'all';
  const period=['1','7','30'].includes(params.get('period'))?params.get('period'):'7';
  const edition=(countryLang[country]||['US','en-US','en']).slice();
  if(langCode[language]) {
    edition[2]=langCode[language];
    edition[1]=edition[2]==='en'?('en-'+edition[0]):edition[2];
  }
  const [countryCode,hl,lang]=edition;
  const feed = new URL('https://news.google.com/rss/search');
  feed.searchParams.set('q',topics[topic]+` when:${period}d`);
  feed.searchParams.set('hl',hl);
  feed.searchParams.set('gl',countryCode);
  feed.searchParams.set('ceid',`${countryCode}:${lang}`);
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=600, stale-while-revalidate=1800');
  const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),8000);
  try {
    const response=await fetch(feed,{signal:abort.signal,headers:{'User-Agent':'OpenLensDemo/1.0 (non-commercial headline review)'}});
    if(!response.ok)throw new Error('Upstream HTTP '+response.status);
    const xml=await response.text();
    const articles=parseFeed(xml,edition);
    if(!articles.length)throw new Error('Feed returned no articles');
    res.statusCode=200;
    return res.end(JSON.stringify({articles,provider:'Google News RSS',edition:{country:countryCode,language:lang},fetchedAt:new Date().toISOString(),warning:'Headlines and feed metadata only. Links may redirect via Google News. Country refers to news edition, not publisher country.'}));
  } catch(err) {
    res.statusCode=503;
    return res.end(JSON.stringify({error:'News feed currently unavailable. Browser may attempt GDELT directly.',detail:String(err.message||err)}));
  } finally {clearTimeout(timeout)}
}
