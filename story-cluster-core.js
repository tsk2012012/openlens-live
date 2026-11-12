/* OpenLens event clustering v2: transparent, conservative, multilingual headline matching.
   No article bodies, embeddings, fabricated facts or inferred political labels.
   Shared between browser and Node tests. Keep match uncertainty visible. */
(function(root){
'use strict';
const STOP=new Set((
 'de het een en van voor met dat die deze dit zijn heeft hebben wordt werden wordt om als ook bij door uit over na aan op in te tot niet nog naar maar dan er hun ons onze zij hij haar zijn'
 +' the a an of for with that this these those has have had was were from into amid after before over under at on to by is are be will says said say new latest more update updates live report reports reporting'
 +' der die das den dem ein eine und von für mit bei auf im zum zur des ist sind wird werden als auch nach über gegen unter aus am nicht neue neuen weitere'
 +' le la les du des de dans et en pour avec sur est sont aux au une un plus apres selon par que cette ces il elle'
 +' of or nor and oraz un et und de en'
 +' nieuws news breaking bericht berichten berichtgeving politie politiek politics political dutch dutchnews europa europe european europees europeese eu'
 +' regering government kabinet ministers minister lawmakers officials leaders president parlement parliament politician politicus'
 +' update gisteren vandaag today tomorrow yesterday nederlandse euroland'
).split(/\s+/));
const MAP=new Map(Object.entries({
 'nederland':'nederland','nederlands':'nederland','netherlands':'nederland','niederlande':'nederland',
 'holland':'nederland','hollande':'nederland','niederlandische':'nederland',
 'belgie':'belgie','belgium':'belgie','belgien':'belgie','belgique':'belgie',
 'duitsland':'duitsland','germany':'duitsland','deutschland':'duitsland','allemagne':'duitsland',
 'frankrijk':'frankrijk','france':'frankrijk','frankreich':'frankrijk',
 'oekraiene':'oekraine','oekraine':'oekraine','ukraine':'oekraine','ukrainian':'oekraine','ukrainische':'oekraine',
 'rusland':'rusland','russia':'rusland','russie':'rusland','russian':'rusland',
 'verenigdestaten':'amerika','america':'amerika','american':'amerika','usa':'amerika',
 'israel':'israel','israeli':'israel','iran':'iran','china':'china','chinese':'china','canada':'canada',
 'gaza':'gaza','rafah':'rafah','kyiv':'kyiv','kiev':'kyiv','moskou':'moskou','moscow':'moskou',
 'brussel':'brussel','brussels':'brussel','bruxelles':'brussel','brusselss':'brussel',
 'verkiezing':'verkiezing','verkiezingen':'verkiezing','elections':'verkiezing','election':'verkiezing','wahl':'verkiezing','wahlen':'verkiezing','electionsfr':'verkiezing',
 'asiel':'asiel','asylum':'asiel','asile':'asiel','asyl':'asiel',
 'woning':'woning','woningen':'woning','woningbouw':'woning','woningnood':'woning','housing':'woning','homes':'woning','housebuilding':'woning',
 'huurstijging':'huur','huur':'huur','rents':'huur','rental':'huur','rent':'huur','mieten':'huur','loyer':'huur',
 'stikstof':'stikstof','nitrogen':'stikstof','azote':'stikstof',
 'begroting':'begroting','budget':'begroting','budgets':'begroting','haushalt':'begroting',
 'tarieven':'tarief','tariff':'tarief','tariffs':'tarief','handelstarieven':'tarief','zolle':'tarief','zoll':'tarief',
 'sancties':'sanctie','sanction':'sanctie','sanctions':'sanctie','sanktionen':'sanctie',
 'staken':'staking','staking':'staking','strikes':'staking','strike':'staking','greve':'staking','streik':'staking',
 'belasting':'belasting','belastingen':'belasting','taxes':'belasting','tax':'belasting','steuern':'belasting','impots':'belasting',
 'klimaat':'klimaat','climate':'klimaat','klima':'klimaat','climat':'klimaat',
 'energie':'energie','energy':'energie','energiepreise':'energie','energieprijzen':'energie',
 'migratie':'migratie','migration':'migratie','migrants':'migratie','migranten':'migratie',
 'vluchtelingen':'vluchteling','vluchteling':'vluchteling','refugees':'vluchteling','refugee':'vluchteling','fluchtlinge':'vluchteling',
 'defensie':'defensie','defense':'defensie','defence':'defensie','verteidigung':'defensie',
 'wetgeving':'wet','wet':'wet','law':'wet','laws':'wet','legislation':'wet','gesetz':'wet','loi':'wet',
 'akkoord':'akkoord','deal':'akkoord','agreement':'akkoord','abkommen':'akkoord','accord':'akkoord',
 'rechtszaak':'rechtszaak','court':'rechtszaak','tribunal':'rechtszaak','rechtbank':'rechtszaak','gericht':'rechtszaak',
 'besluit':'besluit','decision':'besluit','decides':'besluit','beschluss':'besluit','decide':'besluit',
 'voorstel':'voorstel','proposal':'voorstel','proposed':'voorstel','proposes':'voorstel','propose':'voorstel','proposition':'voorstel','vorschlag':'voorstel',
 'goedgekeurd':'goedgekeurd','approves':'goedgekeurd','approved':'goedgekeurd','adopts':'goedgekeurd','adopted':'goedgekeurd','angenommen':'goedgekeurd','adopte':'goedgekeurd',
 'afgewezen':'afgewezen','rejects':'afgewezen','rejected':'afgewezen','verworpen':'afgewezen','abgelehnt':'afgewezen','rejete':'afgewezen',
 'aftreden':'aftreden','resigns':'aftreden','resigned':'aftreden','resignation':'aftreden','zurucktritt':'aftreden','demission':'aftreden',
 'aanval':'aanval','attack':'aanval','attacks':'aanval','attacked':'aanval','attaque':'aanval','angriff':'aanval',
 'arrestatie':'arrestatie','arrest':'arrestatie','arrested':'arrestatie','gearresteerd':'arrestatie','festnahme':'arrestatie',
 'hervorming':'hervorming','reform':'hervorming','reforms':'hervorming','reforme':'hervorming',
 'stemmen':'stemming','vote':'stemming','votes':'stemming','voted':'stemming','voting':'stemming','abstimmung':'stemming',
 'coalitie':'coalitie','coalition':'coalitie','koalition':'coalitie',
 'nato':'navo','navo':'navo','omroep':'omroep','broadcaster':'omroep'
}));
const PHRASES=[
 [/tweede kamer|dutch lower house|dutch house of representatives|niederlandische zweite kammer/g,' tweedekamer '],
 [/european commission|europese commissie|europaische kommission|commission europeenne/g,' eucommissie '],
 [/european parliament|europees parlement|europaisches parlament|parlement europeen/g,' euparlement '],
 [/european union|europese unie|europaische union|union europeenne/g,' euunie '],
 [/prime minister|minister president|minister president|premier ministre|bundeskanzler/g,' premier '],
 [/united states|verenigde staten|etats unis|vereinigte staaten/g,' amerika '],
 [/pays bas|pays-bas/g,' nederland ']
];
const COUNTRIES=new Set('nederland belgie duitsland frankrijk oekraine rusland amerika israel iran china canada gaza ukraine syrie syria turkije turkey polen poland zweden sweden italie italy spanje spain japan india pakistan libanon lebanon'.split(' '));
const ACTIONS=new Set('goedgekeurd afgewezen aftreden aanval arrestatie stemming voorstel'.split(' '));
const CONTRADICTIONS=new Set(['goedgekeurd|afgewezen','afgewezen|goedgekeurd','aftreden|voorstel','voorstel|aftreden','arrestatie|goedgekeurd','goedgekeurd|arrestatie']);
const STRONG_ENTITY=new Set('trump biden rutte schoof jetten wilders zelensky putin macron merz vonderleyen asml navo eucommissie euparlement tweedekamer'.split(' '));
const HOURS=96;
function fold(raw){return String(raw||'').toLowerCase().normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[^a-z0-9% ]+/g,' ')
 .replace(/\s+/g,' ').trim();}
function features(article){
 let raw=fold(article.title||article||'');
 for(const [pattern,value] of PHRASES)raw=raw.replace(pattern,value);
 const wordList=raw.split(/\s+/).filter(Boolean);
 const terms=new Set();
 for(const w of wordList){
  if(STOP.has(w)||w.length<3||/^\d{1,2}$/.test(w))continue;
  terms.add(MAP.get(w)||w);
 }
 const countries=new Set([...terms].filter(x=>COUNTRIES.has(x)));
 const actions=new Set([...terms].filter(x=>ACTIONS.has(x)));
 const names=new Set([...terms].filter(x=>STRONG_ENTITY.has(x)));
 const numbers=new Set(wordList.filter(w=>/^(?:19|20)\d\d$/.test(w)));
 const when=Date.parse(article.when||article.publishedAt||article.indexedAt||'');
 return {terms,countries,actions,names,numbers,when:Number.isFinite(when)?when:null,
  publisher:String(article.source||article.domain||'').toLowerCase().trim()};
}
function overlap(a,b){return [...a].filter(x=>b.has(x))}
function evaluate(A,B){
 const gaps=[];
 if(A.when!==null&&B.when!==null&&Math.abs(A.when-B.when)>HOURS*3600000)return null;
 if(A.numbers.size&&B.numbers.size&&!overlap(A.numbers,B.numbers).length)return null;
 // Two distinct geographical actors often indicate two distinct policy decisions.
 const commonCountries=overlap(A.countries,B.countries);
 if(A.countries.size&&B.countries.size&&!commonCountries.length)return null;
 if(A.actions.size&&B.actions.size&&!overlap(A.actions,B.actions).length){
  if([...A.actions].some(x=>[...B.actions].some(y=>CONTRADICTIONS.has(x+'|'+y))))return null;
 }
 const shared=overlap(A.terms,B.terms);
 const sharedInformative=shared.filter(x=>!COUNTRIES.has(x)&&!STRONG_ENTITY.has(x)&&!ACTIONS.has(x));
 const sharedNames=overlap(A.names,B.names);
 const commonActions=overlap(A.actions,B.actions);
 const strongAnchor=sharedNames.length>0||commonCountries.length>0;
 // One generic subject or person never confirms the same event.
 if(shared.length<2||(!sharedInformative.length&&!commonActions.length))return null;
 const minimum=Math.max(1,Math.min(A.terms.size,B.terms.size));
 const score=shared.length/minimum;
 const union=new Set([...A.terms,...B.terms]).size;
 const jaccard=shared.length/Math.max(1,union);
 const sameTime=A.when!==null&&B.when!==null&&Math.abs(A.when-B.when)<=36*3600000;
 const nearDuplicate=shared.length>=3&&score>=.75&&jaccard>=.43;
 const grounded=strongAnchor&&shared.length>=3&&score>=.55&&jaccard>=.31&&(sharedInformative.length>=1||commonActions.length>=1);
 const highOverlap=shared.length>=4&&score>=.67&&jaccard>=.37;
 if(!(nearDuplicate||grounded||highOverlap))return null;
 if(!strongAnchor&&!nearDuplicate&&shared.length<4)return null;
 // Same-publisher rewrites count as one publisher later, not independent evidence.
 const strength=Math.min(1,Math.round((.58*score+.32*jaccard+(strongAnchor?.10:0)+(sameTime?.04:0))*100)/100);
 if(strength<.55)return null;
 return {strength,shared:shared.slice(0,6),sameTime,anchor:strongAnchor};
}
function group(articles,{limit=185}={}){
 const ordered=[...(articles||[])].filter(x=>x&&x.title).sort((a,b)=>(Date.parse(b.when)||0)-(Date.parse(a.when)||0));
 const groups=[];
 for(const article of ordered){
  const info=features(article);
  let best=null,score=-1;
  for(const bucket of groups){
   // Require agreement with the first representative to prevent accidental chain-merging.
   const first=evaluate(info,bucket.fingerprints[0]);if(!first)continue;
   const probes=bucket.fingerprints.slice(1,3),rest=probes.map(x=>evaluate(info,x));
   if(rest.some(x=>!x))continue;
   const s=Math.min(first.strength,...rest.map(x=>x.strength));
   if(s>score){best=bucket;score=s}
  }
  if(best){best.articles.push(article);best.fingerprints.push(info);best.scores.push(score)}
  else groups.push({articles:[article],fingerprints:[info],scores:[]});
 }
 return groups.map(g=>{
  const strength=g.scores.length?Math.min(...g.scores):null;
  const count=g.articles.length,confidence=count<2?'single':strength>=.77?'strong':'tentative';
  const allMatches=g.scores.length;
  return {articles:g.articles,confidence,score:strength===null?null:Math.round(strength*100),
   method:'Multilingual headline, entity, date and contradiction safeguards; not full-text verification',
   detail:count<2?'Er is voor dit bericht geen voldoende vergelijkbare tweede kop gevonden.':
    confidence==='strong'?'Meerdere koppen delen specifieke termen en passen binnen dezelfde tijd- en gebeurteniscontroles.':
    'De koppen komen gedeeltelijk overeen; controleer de oorspronkelijke artikelen voordat je conclusies trekt.',
   matchedPairs:allMatches};
 }).sort((a,b)=>(Date.parse(b.articles[0]?.when)||0)-(Date.parse(a.articles[0]?.when)||0)).slice(0,Math.max(1,Math.min(500,limit)));
}
root.OpenLensStoryClusters=Object.freeze({group,features,evaluate,version:'2.0'});
})(typeof window==='undefined'?globalThis:window);
