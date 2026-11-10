/* Research dossier: candidate coverage, provenance and user-reviewed relevance.
 * No automatic claim that headlines are the same event or that missing links are omissions.
 */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const KEY='openlens.research.dossiers.v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>{try{const u=new URL(s);return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password?u.href:null}catch{return null}};
const limit=(s,n=500)=>String(s??'').slice(0,n);
const css=document.createElement('style');css.textContent="\n.ol-research-panel{margin-top:21px;border:1px solid #dce8e0;background:#fff;border-radius:16px;padding:21px}\n.ol-research-head{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}\n.ol-research-head h2{font-family:Georgia,\"Times New Roman\",serif;font-size:24px;color:#20453d;letter-spacing:-.5px;margin:6px 0}\n.ol-research-head p{font-size:12px;color:#718879;line-height:1.7;max-width:730px;margin:5px 0}\n.ol-research-actions{display:flex;flex-wrap:wrap;gap:8px}\n.ol-research-btn{background:#eff8f2;border:1px solid #cde2d4;color:#13765e;font-weight:750;font-size:11px;padding:10px 12px;border-radius:9px;cursor:pointer}\n.ol-research-btn.primary{background:#147966;border-color:#147966;color:#fff}\n.ol-research-btn:disabled{opacity:.6;cursor:progress}\n.ol-research-summary{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}\n.ol-research-stat{background:#f4f9f5;border:1px solid #dceae0;border-radius:9px;padding:11px 13px;min-width:105px}\n.ol-research-stat strong{display:block;font-size:20px;color:#245847}\n.ol-research-stat span{font-size:10px;color:#728b7c}\n.ol-research-warning{border:1px solid #ecdfbb;background:#fffbef;color:#87672e;padding:12px;border-radius:10px;font-size:11px;line-height:1.6}\n.ol-research-sources{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}\n.ol-research-sources span{background:#eef4f1;border:1px solid #dce7df;border-radius:6px;padding:5px 8px;font-size:10px;color:#5a7869}\n.ol-research-sources span.unavailable{background:#f9eeee;border-color:#f0dad9;color:#956860}\n.ol-research-list{display:grid;gap:9px;margin-top:14px}\n.ol-research-item{background:#fdfefd;border:1px solid #e2ece5;border-radius:11px;padding:13px;display:grid;gap:8px}\n.ol-research-item h3{font-size:13px;line-height:1.5;color:#244a40;margin:0}\n.ol-research-item a{color:#0b7865;text-decoration:underline;font-size:11px;font-weight:750;overflow-wrap:anywhere}\n.ol-research-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:10px;color:#728a7d}\n.ol-research-state{font-size:10px;font-weight:760;border:1px solid #dae8de;border-radius:6px;padding:5px 7px;color:#477d64;background:#eef8f1}\n.ol-research-state.dismissed{background:#f4f5f5;color:#677985}\n.ol-research-state.confirmed{background:#def3e9;color:#1a765b}\n.ol-research-decision{display:flex;flex-wrap:wrap;gap:7px}\n.ol-research-decision button{border:1px solid #d8e8dc;border-radius:7px;background:white;color:#426e5c;cursor:pointer;padding:7px 9px;font-size:11px;font-weight:720}\n.ol-research-decision button[aria-pressed=\"true\"]{background:#155a4c;border-color:#155a4c;color:white}\n.ol-research-item textarea{width:100%;min-height:65px;max-height:160px;resize:vertical;border:1px solid #d7e6db;border-radius:8px;background:#fff;color:#22463c;padding:9px;font-size:12px}\n.ol-research-item label{font-size:11px;color:#5e7d6c}\n.ol-research-foot{margin:12px 0 0;color:#7a8c80;font-size:10px;line-height:1.7}\nhtml[data-ol-theme=\"dark\"] .ol-research-panel,html[data-ol-theme=\"dark\"] .ol-research-item{background:#172832!important;border-color:#344e4e!important;color:#dceee6!important}\nhtml[data-ol-theme=\"dark\"] .ol-research-panel h2,html[data-ol-theme=\"dark\"] .ol-research-item h3{color:#e4f0e9!important}\nhtml[data-ol-theme=\"dark\"] .ol-research-item textarea{background:#253942;color:#ecf6ef;border-color:#3c5352}\nhtml[data-ol-theme=\"dark\"] .ol-research-warning{background:#403729;border-color:#5e5337;color:#e4cdaa}\nhtml[data-ol-theme=\"dark\"] .ol-research-stat{background:#203640;border-color:#36554f}\nhtml[data-ol-theme=\"dark\"] .ol-research-stat strong{color:#dcefe3}\n@media(max-width:650px){.ol-research-panel{padding:15px}.ol-research-head h2{font-size:21px}.ol-research-actions{width:100%}.ol-research-btn{flex:1}}\n";document.head.append(css);
let dossiers={};
try{const r=JSON.parse(localStorage.getItem(KEY)||'{}');if(r.version===1&&r.items&&typeof r.items==='object')dossiers=r.items}catch{}
let loading=false,activeKey=null;
function save(){
 try{localStorage.setItem(KEY,JSON.stringify({version:1,items:dossiers,updatedAt:new Date().toISOString()}));return true}
 catch{return false}
}
function currentStory(){
 if(state.view!=='dashboard'||!document.querySelector('.ol-reader'))return null;
 return (state.stories||[]).find(s=>s.id===state.selected)||null;
}
function storyKey(story){
 const article=story.articles?.find(a=>safe(a.url));
 return limit(article?.url||story.title,350);
}
function dossier(story){
 const key=storyKey(story);activeKey=key;
 if(!dossiers[key]){
  dossiers[key]={headline:story.title,createdAt:new Date().toISOString(),checkedAt:null,items:[],sourceStatus:[],
   decisions:{},notes:{},error:null,search:'',warning:null};
  save();
 }
 return dossiers[key];
}
const when=d=>d&&Number.isFinite(Date.parse(d))?new Date(d).toLocaleString('nl-NL'):'Datum onbekend';
const decisionLabel=v=>v==='confirmed'?'Zelf bevestigd: dezelfde gebeurtenis':v==='dismissed'?'Door jou uitgesloten':'Nog niet beoordeeld';
const sourceLabel=n=>{
 let r={};try{r=window.OpenLensPublisherRatingLookup?.(n)||{}}catch{}
 return ['Left','Lean Left','Center','Lean Right','Right'].includes(r.rating)?
  'Bronprofiel '+r.rating+' ('+(r.provider||'AllSides')+')':r.originalOrientation?'Bronprofiel '+r.originalOrientation:'Geen vergelijkbare politieke score';
};
function articleItem(article,record){
 const href=safe(article.url);if(!href)return '';
 const decision=record.decisions[href]||'unreviewed',note=record.notes[href]||'';
 const options=[['confirmed','Zelfde gebeurtenis'],['dismissed','Niet dezelfde gebeurtenis'],['unreviewed','Nog beoordelen']].map(([v,t])=>
 '<button type="button" data-ol-research-decision="'+esc(v)+'" data-ol-research-url="'+esc(href)+'" aria-pressed="'+(decision===v)+'">'+t+'</button>').join('');
 const dateType=article.provider==='GDELT DOC 2.0'?'geïndexeerd':article.provider==='Google News RSS'?'RSS-datum':'bronfeed-datum';
 return '<article class="ol-research-item"><div class="ol-research-meta"><strong>'+esc(article.source||'Onbekende bron')+'</strong> · '+
 esc(article.provider||'Nieuwsindex')+' · '+esc(when(article.when))+' ('+dateType+')</div>'+
 '<h3>'+esc(article.title)+'</h3>'+
 '<a target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">Open bericht'+(article.provider==='Google News RSS'?' via Google News':' bij uitgever')+' ↗</a>'+
 '<div class="ol-research-meta"><span class="ol-research-state '+esc(decision)+'">'+esc(decisionLabel(decision))+'</span>'+
 '<span>'+esc(sourceLabel(article.source))+'</span>'+
 (Number.isFinite(article.score)?'<span>Titeloverlap-indicator '+Number(article.score)+'% — géén kansberekening</span>':'')+'</div>'+
 '<div class="ol-research-decision" role="group" aria-label="Eigen beoordeling artikel">'+options+'</div>'+
 '<label>Onderzoeksnotitie (lokaal opgeslagen)<textarea data-ol-research-note="'+esc(href)+'" maxlength="1600" placeholder="Bijvoorbeeld: welke claim of invalshoek wil ik controleren?">'+esc(note)+'</textarea></label></article>';
}
function view(){
 const story=currentStory();if(!story)return;
 const record=dossier(story),original=story.articles||[];
 const confirmed=Object.values(record.decisions).filter(x=>x==='confirmed').length,
  excluded=Object.values(record.decisions).filter(x=>x==='dismissed').length;
 const sourceStatus=(record.sourceStatus||[]).map(x=>
 '<span class="'+(x.status==='ok'?'':'unavailable')+'">'+esc(x.source||'Index')+' · '+
 (x.status==='ok'?x.count+' kandidaten':'niet beschikbaar')+'</span>').join('');
 const cards=(record.items||[]).slice(0,40).map(x=>articleItem(x,record)).join('');
 const html='<section class="ol-research-panel" id="ol-research-panel"><div class="ol-research-head"><div><span class="ol-newsroom-kicker">VERDIEPEND ONDERZOEK</span>'+
 '<h2>Zoek meer berichtgeving bij dit verhaal</h2><p>Vergelijk originele koppen en nieuwsbronnen, beoordeel zelf of berichten dezelfde gebeurtenis behandelen, documenteer claims en exporteer je dossier.</p></div>'+
 '<div class="ol-research-actions"><button class="ol-research-btn primary" type="button" data-ol-research-search'+(loading?' disabled':'')+'>'+
 (loading?'Zoeken…':'↻ Zoek aanvullende bronnen')+'</button>'+
 '<button class="ol-research-btn" type="button" data-ol-research-export>Exporteer dossier</button></div></div>'+
 '<div class="ol-research-summary">'+
 '<div class="ol-research-stat"><strong>'+original.length+'</strong><span>Berichten in huidig verhaal</span></div>'+
 '<div class="ol-research-stat"><strong>'+(record.items?.length||0)+'</strong><span>Extra kandidaat-artikelen</span></div>'+
 '<div class="ol-research-stat"><strong>'+confirmed+'</strong><span>Handmatig gekoppeld</span></div>'+
 '<div class="ol-research-stat"><strong>'+excluded+'</strong><span>Niet relevant beoordeeld</span></div></div>'+
 '<div class="ol-research-warning">Een overeenkomst in kopwoorden betekent <strong>niet</strong> dat het dezelfde gebeurtenis betreft. '+
 'De politieke aanduiding hoort bij de uitgever, niet bij de juistheid of inhoud van een artikel. Geen gevonden artikel betekent niet dat een redactie het onderwerp negeert.</div>'+
 (record.checkedAt?'<p class="ol-research-foot">Zoekopdracht: '+esc(record.search)+' · gecontroleerd '+esc(when(record.checkedAt))+'</p>':
 '<p class="ol-research-foot">Deze extra zoekactie start alleen wanneer je op de knop drukt. De bevindingen blijven lokaal in deze browser.</p>')+
 (sourceStatus?'<div class="ol-research-sources">'+sourceStatus+'</div>':'')+
 (record.error?'<p class="ol-research-foot" role="status">'+esc(record.error)+'</p>':'')+
 '<div class="ol-research-list">'+(cards||'<p class="ol-research-foot">Nog geen aanvullende artikelkandidaten opgehaald of gevonden.</p>')+'</div>'+
 '<p class="ol-research-foot">Bronmetadata wordt getoond zonder overname van beschermde artikelteksten. Eigen beoordelingen en notities zijn niet onafhankelijk gecontroleerd.</p></section>';
 const element=document.createElement('div');element.innerHTML=html;
 const section=element.firstElementChild;
 const prior=document.querySelector('#ol-research-panel');if(prior)prior.remove();
 const insertion=document.querySelector('.ol-reader-analyses')||document.querySelector('.ol-reader-compare-grid');
 if(insertion)insertion.before(section);else document.querySelector('.ol-reader')?.append(section);
}
async function search(){
 const story=currentStory();if(!story||loading)return;
 const record=dossier(story);
 loading=true;view();
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13000);
 try{
  const url='/api/coverage?'+new URLSearchParams({headline:story.title,days:'7'});
  const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
  const data=await response.json();
  if(!response.ok||!Array.isArray(data.matches))throw Error(data.error||'Zoeken mislukt');
  const known=new Set(story.articles.map(a=>a.url));
  const merged=new Map((record.items||[]).filter(x=>safe(x.url)).map(x=>[x.url,x]));
  for(const candidate of data.matches.filter(x=>safe(x.url)&&!known.has(x.url))){
   if(!merged.has(candidate.url))merged.set(candidate.url,{
    url:candidate.url,title:limit(candidate.title,350),source:limit(candidate.source,120),
    when:candidate.when,provider:limit(candidate.provider,60),
    score:Math.min(100,Math.max(0,Number(candidate.score)||0)),matchedKeywords:candidate.matchedKeywords||[]
   });
  }
  record.items=[...merged.values()].sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0,60);
  record.checkedAt=data.checkedAt;record.search=data.query;record.sourceStatus=data.sourceStatus||[];
  record.warning=data.warning;record.error=null;save();
 }catch(error){record.error=error.name==='AbortError'?'Bronzoekactie duurde te lang. Probeer opnieuw.':limit(error.message,180)}
 finally{clearTimeout(timer);loading=false;if(currentStory())view()}
}
function exportDossier(){
 const story=currentStory();if(!story)return;
 const record=dossier(story);
 const payload={app:'OpenLens',type:'Research dossier',exportedAt:new Date().toISOString(),
  methodologicalLimits:'Title matches unverified; manual decisions are user opinions; missing publishers are not proven omissions.',
  story:{title:story.title,topic:story.topic,articles:(story.articles||[]).map(a=>({title:a.title,url:a.url,source:a.source,when:a.when,provider:a.provider,dateType:a.dateType}))},
  research:record};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='openlens-onderzoeksdossier.json';document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);
}
const prev=render;render=function(){prev();view()};
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('[data-ol-research-search],[data-ol-research-export],[data-ol-research-decision]');
 if(!btn)return;
 if(btn.hasAttribute('data-ol-research-search')){e.preventDefault();e.stopImmediatePropagation();search();return}
 if(btn.hasAttribute('data-ol-research-export')){e.preventDefault();e.stopImmediatePropagation();exportDossier();return}
 if(btn.dataset.olResearchDecision){
  e.preventDefault();e.stopImmediatePropagation();
  const story=currentStory();if(!story)return;
  const d=dossier(story),url=btn.dataset.olResearchUrl;
  if(!safe(url))return;d.decisions[url]=btn.dataset.olResearchDecision;save();view();
 }
},true);
document.addEventListener('change',e=>{
 const field=e.target.closest?.('[data-ol-research-note]');
 if(!field)return;
 const story=currentStory();if(!story)return;
 const url=field.dataset.olResearchNote;if(!safe(url))return;
 dossier(story).notes[url]=limit(field.value,1600);save();
});
})();
