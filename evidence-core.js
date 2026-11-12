/* OpenLens evidence comparison — deterministic observed mentions, never inferred claims.
 * Runs in Node and browsers. No article-body text is fetched or stored by this module. */
(function(root){
'use strict';
const SIGNALS=[
 ['eu-commission','Europese Commissie','instelling',/\b(?:europese commissie|european commission|commission europeenne|europaische kommission)\b/i],
 ['european-parliament','Europees Parlement','instelling',/\b(?:europees parlement|european parliament|parlement europeen|europaisches parlament)\b/i],
 ['eu-council','Europese Raad / EU-Raad','instelling',/\b(?:europese raad|european council|raad van de europese unie|council of the european union)\b/i],
 ['tweede-kamer','Tweede Kamer','instelling',/\b(?:tweede kamer|dutch house of representatives|dutch lower house)\b/i],
 ['eerste-kamer','Eerste Kamer','instelling',/\b(?:eerste kamer|dutch senate)\b/i],
 ['nato','NAVO / NATO','instelling',/\b(?:navo|nato|north atlantic treaty organization)\b/i],
 ['un','Verenigde Naties','instelling',/\b(?:verenigde naties|united nations|vn-veiligheidsraad|un security council)\b/i],
 ['oecd','OESO / OECD','instelling',/\b(?:oeso|oecd|organisation for economic co-operation)\b/i],
 ['ecb','Europese Centrale Bank','instelling',/\b(?:europese centrale bank|european central bank|\becb\b)\b/i],
 ['rutte','Mark Rutte','persoon',/\b(?:mark rutte|rutte)\b/i],
 ['wilders','Geert Wilders','persoon',/\b(?:geert wilders|wilders)\b/i],
 ['jetten','Rob Jetten','persoon',/\b(?:rob jetten|jetten)\b/i],
 ['bontenbal','Henri Bontenbal','persoon',/\b(?:henri bontenbal|bontenbal)\b/i],
 ['schoof','Dick Schoof','persoon',/\b(?:dick schoof|schoof)\b/i],
 ['trump','Donald Trump','persoon',/\b(?:donald trump|president trump|trump)\b/i],
 ['biden','Joe Biden','persoon',/\b(?:joe biden|biden)\b/i],
 ['zelensky','Volodymyr Zelensky','persoon',/\b(?:zelensky|zelenskyy|zelenski|zelenskyj)\b/i],
 ['putin','Vladimir Poetin','persoon',/\b(?:putin|poetin)\b/i],
 ['macron','Emmanuel Macron','persoon',/\b(?:emmanuel macron|macron)\b/i],
 ['vonderleyen','Ursula von der Leyen','persoon',/\b(?:von der leyen|ursula von der leyen)\b/i],
 ['gaza','Gaza','plaats',/\bgaza\b/i],
 ['brussels','Brussel','plaats',/\b(?:brussel|brussels|bruxelles)\b/i],
 ['hague','Den Haag','plaats',/\b(?:den haag|the hague|la haye)\b/i],
 ['kyiv','Kyiv','plaats',/\b(?:kyiv|kiev)\b/i],
 ['abu-dhabi','Abu Dhabi','plaats',/\babu dhabi\b/i],
 ['netherlands','Nederland','land',/\b(?:nederland|netherlands|nederlandse|dutch)\b/i],
 ['germany','Duitsland','land',/\b(?:duitsland|germany|deutschland)\b/i],
 ['france','Frankrijk','land',/\b(?:frankrijk|france|frankreich)\b/i],
 ['belgium','België','land',/\b(?:belgie|belgië|belgium|belgique)\b/i],
 ['ukraine','Oekraïne','land',/\b(?:oekraine|oekraïne|ukraine|ukrainian)\b/i],
 ['russia','Rusland','land',/\b(?:rusland|russia|russian)\b/i],
 ['china','China','land',/\b(?:china|chinese)\b/i],
 ['israel','Israël','land',/\b(?:israel|israël|israeli)\b/i],
 ['housing','Woningbeleid','onderwerp',/\b(?:woningbouw|woningtekort|housing|houses|sociale huur|affordable homes)\b/i],
 ['migration','Migratie / asiel','onderwerp',/\b(?:migratie|asiel|asylum|migration|refugees|vluchtelingen)\b/i],
 ['budget','Begroting','onderwerp',/\b(?:begroting|budget|rijksbegroting|haushalt)\b/i],
 ['sanctions','Sancties','onderwerp',/\b(?:sancties|sanctions|sanktionen)\b/i],
 ['tariffs','Handelstarieven','onderwerp',/\b(?:tarieven|tariffs|importheffingen|zoll)\b/i],
 ['climate','Klimaatbeleid','onderwerp',/\b(?:klimaat|climate|emissions|uitstoot|cop3[0-9])\b/i],
 ['energy','Energiebeleid','onderwerp',/\b(?:energieprijzen|energy prices|netcongestie|renewable energy|windenergie|offshore wind)\b/i],
 ['elections','Verkiezingen','onderwerp',/\b(?:verkiezingen|election|elections|verkiezingsuitslag)\b/i],
 ['defence','Defensie','onderwerp',/\b(?:defensie|defence|defense|military spending)\b/i],
 ['ai-policy','AI-regels','onderwerp',/\b(?:ai act|artificial intelligence act|kunstmatige intelligentie|ai rules|ai regels)\b/i],
 ['approval','Goedkeuring genoemd','handeling',/\b(?:keurt.{0,30}goed|goedgekeurd|approved|approves|adopts|adopted)\b/i],
 ['rejection','Afwijzing genoemd','handeling',/\b(?:afgewezen|verworpen|rejected|rejects|wijst.{0,30}af)\b/i],
 ['proposal','Voorstel genoemd','handeling',/\b(?:voorstel|proposal|proposes|proposed|wetsvoorstel)\b/i],
 ['strike','Staking genoemd','handeling',/\b(?:staking|strike|strikes|streik)\b/i],
 ['resignation','Aftreden genoemd','handeling',/\b(?:aftreden|afgetreden|resign|resignation|resigns)\b/i]
];
function normalize(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
function words(value,max=22){
 const terms=String(value||'').trim().split(/\s+/).filter(Boolean);
 return terms.slice(0,max).join(' ')+(terms.length>max?' …':'');
}
function observationText(entry){
 const headline=String(entry.title||entry.headline||'').slice(0,350);
 const preview=entry.preview||{};
 const known=preview.summarySource==='Publisher description'?'beschrijving':
  preview.summarySource==='Extracted article lead'?'lead':null;
 const excerpt=known&&typeof preview.synopsis==='string'?preview.synopsis.slice(0,700):'';
 return {headline,excerpt,previewKind:excerpt?known:null};
}
function signalsFor(entry){
 const texts=observationText(entry);
 const found=new Map();
 for(const [id,label,kind,pattern] of SIGNALS){
  const inTitle=pattern.test(normalize(texts.headline));
  const inPreview=!!texts.excerpt&&pattern.test(normalize(texts.excerpt));
  if(inTitle||inPreview)found.set(id,{id,label,kind,from:inTitle?'kop':texts.previewKind});
 }
 // Quoted years are literal mentions, not asserted event dates.
 const all=texts.headline+' '+texts.excerpt;
 for(const year of new Set((all.match(/\b(?:19|20)\d\d\b/g)||[]))){
  found.set('year-'+year,{id:'year-'+year,label:'Jaartal '+year,kind:'tijdsaanduiding',
   from:new RegExp('\\b'+year+'\\b').test(texts.headline)?'kop':texts.previewKind});
 }
 // Unit-bearing amounts are observed strings. Do not normalize approximate figures into claims.
 for(const match of all.matchAll(/\b(\d{1,3}(?:[.,]\d{1,3})?)\s*(%|procent|percent|miljoen|million|miljard|billion|euro)\b/gi)){
  const value=match[1].replace(',','.'), unit=match[2].toLowerCase();
  const normUnit={procent:'%',percent:'%',million:'miljoen',billion:'miljard'}[unit]||unit;
  const id='quantity-'+value+'-'+normUnit;
  if(found.size>=26)break;
  if(!found.has(id))found.set(id,{id,label:match[1]+' '+match[2],kind:'genoemd getal',
   from:texts.headline.includes(match[0])?'kop':texts.previewKind});
 }
 return [...found.values()].slice(0,26);
}
function safeURL(input){
 try{
  const u=new URL(String(input||''));
  if(u.protocol!=='https:'||u.username||u.password||!u.hostname.includes('.')||u.href.length>1800)return null;
  return u.href;
 }catch{return null}
}
function compare(entries){
 const sourceMap=new Map();
 for(const raw of Array.isArray(entries)?entries:[]){
  if(!raw||typeof raw!=='object')continue;
  const publisher=String(raw.publisher||'').trim()||'Onbekende uitgever';
  const url=safeURL(raw.url);if(!url)continue;
  // The same publisher is not independent corroboration, even across several URLs.
  const identity=(raw.publisherKey||publisher).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim();
  const prior=sourceMap.get(identity);
  const existing=prior?observationText(prior).excerpt.length:0;
  const length=observationText(raw).excerpt.length;
  if(!prior||length>existing)sourceMap.set(identity,{...raw,publisher,url});
 }
 const sources=[...sourceMap.values()].slice(0,8).map((raw,i)=>{
  const observed=observationText(raw);
  const signals=signalsFor(raw);
  return {id:i,publisher:raw.publisher,url:raw.url,title:observed.headline,
   when:raw.when||null,excerpt:words(observed.excerpt,22),
   previewKind:observed.previewKind,signals};
 });
 const mentions=new Map();
 for(const source of sources)for(const signal of source.signals){
  const prev=mentions.get(signal.id)||{id:signal.id,label:signal.label,kind:signal.kind,sources:[]};
  prev.sources.push({publisher:source.publisher,url:source.url,from:signal.from});
  mentions.set(signal.id,prev);
 }
 const all=[...mentions.values()].sort((a,b)=>b.sources.length-a.sources.length||
   a.kind.localeCompare(b.kind)||a.label.localeCompare(b.label,'nl'));
 const shared=all.filter(x=>x.sources.length>=2);
 const single=all.filter(x=>x.sources.length===1);
 const metadata=sources.filter(x=>x.previewKind).length;
 return {sources,shared,single,totalSources:sources.length,previewSources:metadata,
  headlineOnly:sources.length-metadata,hasComparison:sources.length>=2,
  evidence:'headlines_and_public_previews_only',
  fullTextVerified:false,
  caveat:'Vermeldingen zijn overeenkomsten in zichtbare koppen en beperkte uitgeverspreviews. Ze bewijzen geen feiten, onafhankelijke bevestiging of weglating.'};
}
root.OpenLensEvidenceCore=Object.freeze({compare,signalsFor,observationText,safeURL,words,version:'1.0'});
})(typeof window==='undefined'?globalThis:window);
