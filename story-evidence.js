/* OpenLens Evidence Matrix: on-demand metadata comparison, scoped to one open story.
   Fetches at most six short publisher previews in a single reader action.
   No paywall bypass, no full-article claim extraction or persistent article text. */
(function(){
'use strict';
if(typeof render!=='function'||typeof filteredArticles!=='function'||!window.OpenLensEvidenceCore)return;
const core=window.OpenLensEvidenceCore;
const MAX_SOURCES=6, MAX_AGE=20*60*1000;
const cache=new Map(),cases=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=core.safeURL;
const sourceName=a=>typeof sourceInfo==='function'?sourceInfo(a).name:String(a.source||a.domain||'Onbekende uitgever');
function story(){
 if(state.view!=='dashboard'||!document.querySelector('.ol-reader'))return null;
 return state.stories?.find(s=>s.id===state.selected)||null;
}
function entriesFor(s){
 const all=filteredArticles(s)||[],chosen=[],seen=new Set();
 for(const article of all){
  const url=safe(article.url),publisher=sourceName(article);
  const key=publisher.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim();
  if(!url||!publisher||seen.has(key))continue;
  seen.add(key);
  chosen.push({url,publisher,publisherKey:key,title:String(article.title||''),
   when:article.when||null});
  if(chosen.length>=MAX_SOURCES)break;
 }
 return chosen;
}
function withPreviews(entries){
 return entries.map(e=>{
  const hit=cache.get(e.url);
  return hit&&Date.now()-hit.when<MAX_AGE?{...e,preview:hit.preview}:e;
 });
}
function evidenceList(rows,label,shared){
 if(!rows.length)return '<p class="ol-evidence-empty">'+
  (shared?'Geen terugkerende signalen aangetroffen in de beschikbare koppen en previews.':
   'Geen afzonderlijke herkenbare signalen aangetroffen.')+'</p>';
 return '<div class="ol-evidence-tags">'+rows.slice(0,shared?16:12).map(x=>
  '<details class="ol-evidence-tag"><summary><strong>'+esc(x.label)+'</strong><span>'+
  x.sources.length+' '+(x.sources.length===1?'uitgever':'uitgevers')+'</span></summary>'+
  '<div class="ol-evidence-attribution">'+x.sources.map(src=>
   '<a href="'+esc(src.url)+'" target="_blank" rel="noopener noreferrer">'+esc(src.publisher)+
   '</a><small> · '+esc(src.from==='kop'?'Kop':src.from==='lead'?'Toegankelijke lead':'Uitgeversbeschrijving')+'</small>'
  ).join('<span class="ol-evidence-sep"> • </span>')+'</div>'+
  '</details>'
 ).join('')+'</div>';
}
function sourceGrid(rows,wait){
 const candidates=rows.map(s=>{
  const reference=s.previewKind==='beschrijving'?'Uitgeversbeschrijving':
   s.previewKind==='lead'?'Toegankelijke lead':'Alleen kop';
  const excerpt=s.excerpt?
   '<p class="ol-evidence-excerpt">'+esc(s.excerpt)+'</p>':
   '<p class="ol-evidence-source-fallback">'+
   (wait?'Openbare preview wordt nog opgehaald.':'Geen toegankelijke beschrijving of lead; alleen de kop is vergelijkbaar.')+'</p>';
  return '<article class="ol-evidence-source"><div class="ol-evidence-source-heading"><strong>'+
   esc(s.publisher)+'</strong><span class="'+(s.previewKind?'has-preview':'headline-only')+'">'+reference+'</span></div>'+
   '<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer" class="ol-evidence-source-title">'+
   esc(s.title)+'</a>'+excerpt+
   '<small>Herkenbare signalen: '+s.signals.length+' · '+
   (s.when&&Number.isFinite(Date.parse(s.when))?esc(new Date(s.when).toLocaleDateString('nl-NL'))+' · ':'')+
   '<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">Lees origineel ↗</a></small></article>';
 });
 return '<div class="ol-evidence-grid">'+candidates.join('')+'</div>';
}
function mount(){
 const s=story(),reader=document.querySelector('.ol-reader');
 if(!s||!reader)return;
 const entries=entriesFor(s),caseData=cases.get(s.id);
 const current=core.compare(withPreviews(entries));
 const loading=caseData?.status==='loading',isReady=caseData?.status==='ready';
 const previous=reader.querySelector('#ol-evidence-panel');
 if(previous)previous.remove();
 const panel=document.createElement('section');panel.id='ol-evidence-panel';
 panel.className='ol-evidence-panel';
 panel.dataset.storyId=s.id;
 const status=current.totalSources<2?'Nog geen twee verschillende uitgevers in deze selectie':
   loading?'Openbare previews worden opgehaald…':
   isReady?'Previews gecontroleerd · '+current.previewSources+' bruikbaar':
   'Vergelijking op basis van koppen · previews nog niet opgehaald';
 panel.innerHTML='<div class="ol-evidence-head"><div><span class="ol-newsroom-kicker">OPENLENS / EVIDENCE DESK</span>'+
  '<h2>Wat noemen de bronnen?</h2>'+
  '<p>Onderzoek herhaalde vermeldingen, bronverschillen en herleidbare tekstbasis — zonder te doen alsof koppen volledige artikelen zijn.</p></div>'+
  '<div class="ol-evidence-tools">'+
  (current.totalSources>=2?'<button type="button" class="ol-evidence-btn primary" data-ol-evidence-run '+(loading?'disabled':'')+'>'+
   (loading?'Previews ophalen…':isReady?'↻ Opnieuw controleren':'Vergelijk openbare previews')+'</button>':'')+
  '<button type="button" class="ol-evidence-btn" data-ol-evidence-export>Exporteer bronnen</button></div></div>'+
  '<div class="ol-evidence-stats"><span><strong>'+current.totalSources+'</strong> verschillende uitgevers</span>'+
  '<span><strong>'+current.previewSources+'</strong> beschikbare previews</span>'+
  '<span><strong>'+current.shared.length+'</strong> gedeelde vermeldingen</span>'+
  '<span><strong>'+current.single.length+'</strong> vermeldingen bij één bron</span></div>'+
  '<p class="ol-evidence-status" role="status" aria-live="polite">'+esc(status)+
  (loading&&caseData?.done!==undefined?' · '+caseData.done+'/'+caseData.total+' pogingen afgerond':'')+'</p>'+
  '<div class="ol-evidence-warn"><strong>Belangrijk:</strong> gedeeld = hetzelfde trefwoord, dezelfde persoon, locatie of getal zichtbaar bij verschillende uitgevers. Dit is <strong>geen onafhankelijk geverifieerd feit</strong>. Alleen bij één bron gezien betekent niet dat anderen het detail hebben weggelaten.</div>'+
  (current.totalSources<2?'<p class="ol-evidence-empty">OpenLens heeft binnen deze selectie onvoldoende verschillende uitgevers om deze gebeurtenis te vergelijken. Dit is een steekproefbeperking, geen bewezen nieuwskloof.</p>':
  '<div class="ol-evidence-two"><section><h3>Vermeld bij meerdere uitgevers</h3>'+evidenceList(current.shared,'Gedeeld',true)+'</section>'+
  '<section><h3>Alleen in één beschikbare kop of preview</h3>'+evidenceList(current.single,'Uniek',false)+'</section></div>')+
  '<div class="ol-evidence-subhead"><h3>Bron voor bron</h3><span>Maximaal '+MAX_SOURCES+' verschillende uitgevers per vergelijking</span></div>'+
  sourceGrid(current.sources,loading)+
  '<p class="ol-evidence-foot">Gegevensbasis: openbare koppen, uitgeversbeschrijvingen en korte toegankelijke leads; maximaal 22 woorden per getoonde preview. Er is geen volledige artikeltekst gelezen of opgeslagen, er is geen factcheck uitgevoerd en aantallen zijn niet representatief voor de hele mediasector. '+(s.clustering?.confidence!=='strong'?'Deze verhaalclustering is bovendien niet met volledige artikelinhoud geverifieerd.':'Ook sterke kopovereenkomsten bewijzen niet dat de artikelen dezelfde gebeurtenis beschrijven.')+'</p>';
 const spot=reader.querySelector('.ol-reader-section-title.ol-reader-analyses')||
            reader.querySelector('#ol-reader-analysis');
 if(spot)spot.before(panel);else reader.append(panel);
}
async function fetchPreview(entry,force=false){
 const hit=cache.get(entry.url);
 if(!force&&hit&&Date.now()-hit.when<MAX_AGE)return hit.preview;
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10500);
 try{
  const res=await fetch('/api/article-preview?'+new URLSearchParams({url:entry.url}),
   {signal:ctl.signal,headers:{Accept:'application/json'}});
  if(!res.ok)throw Error('HTTP '+res.status);
  const payload=await res.json();
  // Whitelist publisher metadata and short preview fields; never use returned HTML.
  const valid=payload&&typeof payload==='object'&&
    ['Publisher description','Extracted article lead'].includes(payload.summarySource)&&
    typeof payload.synopsis==='string'&&payload.synopsis.trim().length>0;
  const preview=valid?{
   synopsis:payload.synopsis.slice(0,700),summarySource:payload.summarySource,fullArticleRead:false
  }:null;
  cache.set(entry.url,{when:Date.now(),preview});
  if(cache.size>45)cache.delete(cache.keys().next().value);
  return preview;
 }catch{
  cache.set(entry.url,{when:Date.now(),preview:null});
  return null;
 }finally{clearTimeout(timer)}
}
async function start(id){
 const s=story();if(!s||s.id!==id)return;
 const rows=entriesFor(s),previous=cases.get(id);
 if(previous?.status==='loading'||rows.length<2)return;
 const record={status:'loading',done:0,total:rows.length};cases.set(id,record);
 mount();
 let next=0;
 const worker=async()=>{
  while(next<rows.length){
   const entry=rows[next++];
   await fetchPreview(entry,previous?.status==='ready');
   record.done++;
   if(story()?.id===id)mount();
  }
 };
 await Promise.all(Array.from({length:Math.min(3,rows.length)},worker));
 record.status='ready';
 if(story()?.id===id)mount();
}
function exportEvidence(id){
 const s=story();if(!s||s.id!==id)return;
 const snapshot=core.compare(withPreviews(entriesFor(s)));
 const safeRows=rows=>rows.map(x=>({label:x.label,kind:x.kind,sources:x.sources}));
 const result={
  generatedAt:new Date().toISOString(),storyTitle:s.title,
  storyLinkConfidence:s.clustering?.confidence||'unknown',fullTextVerified:false,
  status:'observed_headline_or_preview_mentions_not_verified_facts',
  sample:{publishers:snapshot.totalSources,publicPreviews:snapshot.previewSources,
   sharedMarkers:snapshot.shared.length,oneSourceMarkers:snapshot.single.length},
  sources:snapshot.sources.map(x=>({publisher:x.publisher,url:x.url,title:x.title,
   when:x.when,availablePreviewKind:x.previewKind,shortPreview:x.excerpt})),
  sharedMentions:safeRows(snapshot.shared),oneSourceMentions:safeRows(snapshot.single),
  methodology:snapshot.caveat
 };
 const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='openlens-evidence-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
document.addEventListener('click',event=>{
 const el=event.target.closest?.('[data-ol-evidence-run],[data-ol-evidence-export]');
 if(!el)return;
 event.preventDefault();
 const id=el.closest('[data-story-id]')?.dataset.storyId;
 if(!id)return;
 if(el.hasAttribute('data-ol-evidence-run'))start(id);
 else exportEvidence(id);
});
const priorRender=render;
render=function(){priorRender();mount()};
mount();
window.OpenLensEvidenceDesk=Object.freeze({version:'1.0',get cacheSize(){return cache.size}});
})();
