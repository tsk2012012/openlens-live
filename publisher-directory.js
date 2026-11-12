/* A publisher directory for sources in the current news sample. */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui={query:'',filter:'all',region:'all',expanded:false,groups:{},discovered:[],updated:null,loading:false,started:false,error:'',archive:{publishers:[],summary:null,state:'loading'}};
const safeLink=raw=>{try{const u=new URL(raw);return u.protocol==='https:'&&/(^|\.)(allsides\.com|eurotopics\.net)$/i.test(u.hostname)?u.href:null}catch{return null}};

const regionNames={nl:'Nederland',eu:'Europa / EU',world:'Wereld',other:'Overige'};
const normal=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cacheKey='openlens.publisher.discovery.v2';
try{const c=JSON.parse(localStorage.getItem(cacheKey)||'null');if(c){ui.discovered=Array.isArray(c.names)?c.names:[];ui.updated=c.updated||null}}catch{}
async function loadCatalog(){
 try{const r=await fetch('/publisher-catalog.json');if(!r.ok)throw Error('catalog unavailable');const d=await r.json();ui.groups=d.groups||{};if(state.view==='publishers')markup()}catch(e){ui.error='Catalogusbestand niet beschikbaar';if(state.view==='publishers')markup()}
}

async function loadEvidence(){
 try{
  const response=await fetch('/api/publisher-stats',{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.publishers)||!data.summary)throw Error('invalid archive summary');
  ui.archive={...data,state:'ready'};
  if(state.view==='publishers')markup();
 }catch(e){
  ui.archive={publishers:[],summary:null,state:'unavailable'};
  ui.error='Neon-archief tijdelijk niet bereikbaar; historische aantallen zijn onbekend.';
  if(state.view==='publishers')markup();
 }
}
function evidenceStats(){
 const stats=new Map();
 for(const a of ui.archive.publishers||[]){
  const name=window.OpenLensPublisherProfiles?.lookup(a.name)?.name||a.name;
  const key=normal(name);if(!key)continue;
  const old=stats.get(key)||{articles:0,topics:0,lastSeen:null,names:[]};
  old.articles+=Math.max(0,Number(a.articles)||0);
  old.topics=Math.max(old.topics,Number(a.topics)||0);
  const date=Date.parse(a.lastObservedAt||a.latestArticleAt||0);
  if(Number.isFinite(date)&&(!old.lastSeen||Date.parse(old.lastSeen)<date))old.lastSeen=new Date(date).toISOString();
  old.names.push(a.name);
  stats.set(key,old);
 }
 return stats;
}
function surveyBar(list){
 const observed=list.filter(p=>p.live),counts={left:0,center:0,right:0,unknown:0};
 for(const p of observed){const group=tone(p);counts[group==='other'?'unknown':group]++}
 const total=observed.length||0;
 const portions=Object.entries(counts).map(([k,n])=>'<span title="'+k+': '+n+' uitgevers" style="width:'+(total?100*n/total:0)+'%;height:100%;background:'+({left:'#3c70d6',center:'#6b9b83',right:'#d45e5c',unknown:'#95a2a5'}[k])+'"></span>').join('');
 return '<section style="border:1px solid var(--line,#dce5df);padding:16px;border-radius:12px;margin:14px 0"><strong>Politieke bronverdeling in waargenomen uitgevers</strong>'+
 '<div style="display:flex;overflow:hidden;height:20px;border-radius:7px;margin:10px 0;background:#dfe6e5">'+portions+'</div>'+
 '<div style="display:flex;flex-wrap:wrap;gap:12px;font-size:12px">'+Object.entries(counts).map(([k,n])=>'<span>'+({left:'Links',center:'Midden',right:'Rechts',unknown:'Onvoldoende / niet vergelijkbaar'}[k])+': <strong>'+n+'</strong>'+(total?' ('+Math.round(n/total*100)+'%)':'')+'</span>').join('')+'</div>'+
 '<p style="font-size:11px;margin:10px 0 0;color:var(--muted,#667)">De percentages tellen unieke waargenomen uitgevers, niet alle artikelen, kiezers of de politieke inhoud van een specifieke reportage. Onbeoordeeld blijft zichtbaar.</p></section>'
}
async function scan(force){
 if(ui.loading||(!force&&ui.updated&&Date.now()-Date.parse(ui.updated)<1800000))return;
 ui.loading=true;ui.error='';if(state.view==='publishers')markup();
 const outcomes=await Promise.all([['nl','netherlands'],['eu','europe'],['world','world']].map(async ([region,topic])=>{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),26000);
  try{const r=await fetch('/api/news?'+new URLSearchParams({topic,period:'7'}),{signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json();return {region,articles:Array.isArray(d.articles)?d.articles:[]}}
  catch(e){return {region,error:String(e.message||e)}}finally{clearTimeout(timer)}
 }));
 const known=new Map(ui.discovered.map(x=>[normal(x.name),x]));
 for(const batch of outcomes)for(const a of batch.articles||[]){
  const name=String(typeof sourceInfo==='function'?sourceInfo(a)?.name:a.source||'').trim();
  if(!name||/^unknown/i.test(name))continue;
  const key=normal(name),old=known.get(key);
  if(!old||Date.parse(a.when||0)>Date.parse(old.when||0))known.set(key,{name,region:batch.region,when:a.when||null});
 }
 ui.discovered=[...known.values()].slice(0,2000);
 const ok=outcomes.filter(x=>!!x.articles).length;
 if(ok){ui.updated=new Date().toISOString();try{localStorage.setItem(cacheKey,JSON.stringify({names:ui.discovered,updated:ui.updated}))}catch{}}
 if(ok<3)ui.error='Gedeeltelijke scan: '+ok+' van de 3 regio’s konden worden opgehaald.';
 ui.loading=false;if(state.view==='publishers')markup();
}

function publishers(){
 const names=new Map();
 const registry=window.OpenLensPublisherProfiles;
 const add=(original,region,live=false,when=null)=>{
  if(typeof original!=='string'||!original.trim()||/^unknown/i.test(original))return;
  const profile=registry?.lookup(original)||null;
  const name=profile?.name||original;
  const key=normal(name),old=names.get(key);
  const geographic=profile?.country==='NL'?'nl':profile?.country==='BE'||profile?.country==='EU'?'eu':region;
  if(old){
   if(live){old.live=true;if(when&&(!old.when||Date.parse(when)>Date.parse(old.when)))old.when=when}
   if(profile)old.region=geographic;
   return;
  }
  names.set(key,{name,region:geographic||'other',live,when});
 };
 for(const region of ['nl','eu','world'])
  for(const name of ui.groups[region]||[])add(name,region);
 for(const p of registry?.profiles||[])add(p.name,p.country==='NL'?'nl':p.country==='BE'||p.country==='EU'?'eu':'world');
 for(const a of state.allArticles||[])add(typeof sourceInfo==='function'?sourceInfo(a)?.name:a.source,'other',true,a.when);
 for(const a of ui.discovered||[])add(a.name,a.region||'other',true,a.when);
 for(const a of ui.archive.publishers||[])if(Number(a.articles)>0)add(a.name,'other',true,a.lastObservedAt||a.latestArticleAt);
 return [...names.values()].sort((a,b)=>a.name.localeCompare(b.name,'nl',{sensitivity:'base'})).map(entry=>{
  const name=entry.name,profile=registry?.lookup(name)||null;
  const meta=window.OpenLensSourceAudit?.lookup(name)||null;
  const external=window.OpenLensPublisherRatingLookup?.(name)||null;
  const institutional=profile?profile.type==='beleidsinstelling'||profile.type==='overheid':meta?.politicallyAssessable===false;
  const euro=window.OpenLensPublisherOrientationLookup?.(name)||null;
  const rawRating=external?.provider==='AllSides'?external.rating:meta?.rating||null;
  const ratingLink=safeLink(external?.provider==='AllSides'?external?.source:meta?.source);
  const orientationLink=safeLink(euro?.source);
  const rating=!institutional&&ratingLink&&['Left','Lean Left','Center','Lean Right','Right'].includes(rawRating)?rawRating:null;
  const orientation=!institutional&&orientationLink?euro?.orientation:null;
  const kind=institutional?'institution':rating||orientation?'rated':'unrated';
  const categories={redactie:'Nieuwsredactie',vakmedium:'Specialistische nieuwstitel',
   'publieke-omroep':'Publieke nieuwsvoorziening',onderzoeksjournalistiek:'Onderzoeksjournalistiek',
   weekblad:'Weekblad'};
  return {...entry,name,kind,
   type:profile?categories[profile.type]||profile.type:meta?.type||'Identiteit nog niet beoordeeld',
   profile,owner:profile?.owner||null,
   ownershipSource:profile?.ownershipSource||null,ownershipVerified:!!profile?.owner&&!!profile?.ownershipSource,
   rating,orientation,provider:rating?'AllSides':orientation?'Eurotopics':null,
   link:rating?ratingLink:orientationLink,orientationLink, ratingLink:rating?ratingLink:null,
   note:profile?.note||meta?.typeExplanation||'Uitgeversidentiteit nog niet volledig beoordeeld.'
  };
 });
}

const tone=m=>{
 if(m.rating==='Left'||m.rating==='Lean Left')return 'left';
 if(m.rating==='Center')return 'center';
 if(m.rating==='Right'||m.rating==='Lean Right')return 'right';
 return 'other';
};
const safeOwnershipLink=raw=>{
 try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')?u.href:null}
 catch{return null}
};
const colorStyle=document.createElement('style');
colorStyle.textContent='.ol-dir-badge.ol-dir-left{background:#dfeaff!important;color:#204b9e!important;border-left:4px solid #3c70d6}.ol-dir-badge.ol-dir-center{background:#e5ede7!important;color:#355747!important;border-left:4px solid #6b9b83}.ol-dir-badge.ol-dir-right{background:#ffe4e3!important;color:#963b3a!important;border-left:4px solid #d45e5c}.ol-dir-badge.ol-dir-other{background:#edf0f1!important;color:#455b61!important;border-left:4px solid #95a2a5}.ol-dir-legend{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0;font-size:11px;align-items:center}.ol-dir-legend span{display:inline-flex;gap:6px;align-items:center}.ol-dir-legend i{height:10px;width:10px;border-radius:3px;display:inline-block}.ol-dir-legend .left{background:#3c70d6}.ol-dir-legend .center{background:#6b9b83}.ol-dir-legend .right{background:#d45e5c}.ol-dir-legend .other{background:#95a2a5}';
document.head.append(colorStyle);

function markup(){
 const list=publishers(),rated=list.filter(x=>x.rating).length,
  owners=list.filter(x=>x.ownershipVerified).length,unrated=list.length-rated;
 const observed=evidenceStats(),liveCount=list.filter(x=>x.live).length;
 const status=m=>m.rating||m.orientation||'Geen politieke beoordeling';
 const rows=list.map(m=>{
  const metrics=observed.get(normal(m.name));
  const ownerSource=safeOwnershipLink(m.ownershipSource);
  const sourceDate=m.profile?.verifiedAt||null;
  const ownership=m.owner?
   '<span class="ol-publisher-owner">Mediagroep: <strong>'+esc(m.owner)+'</strong>'+
      (ownerSource?' · <a href="'+esc(ownerSource)+'" target="_blank" rel="noopener noreferrer">Eigendomsbron ↗</a>':'')+'</span>':
    '<span class="ol-publisher-owner muted">Eigendom nog niet gedocumenteerd</span>';
  const observedText=ui.archive.state==='ready'?
    ' · Archief: '+(metrics?.articles||0)+' unieke artikelen'+
    (metrics?.topics?' · minimaal '+metrics.topics+' onderwerpen':''):
    ' · Archief niet beschikbaar';
  const searchable=normal(m.name+' '+m.type+' '+(m.owner||'')+' '+(m.profile?.aliases||[]).join(' '));
  return '<article class="ol-dir-row ol-publisher-profile" data-ol-dir-region="'+m.region+
   '" data-ol-dir-live="'+m.live+'" data-ol-dir-kind="'+m.kind+'" data-ol-dir-name="'+esc(searchable)+'">'+
   '<div class="ol-dir-name"><strong>'+esc(m.name)+'</strong><span>'+esc(regionNames[m.region]||'Overige')+
   ' · '+esc(m.type)+(m.live?' · Waargenomen':' · Catalogus')+esc(observedText)+'</span>'+
   ownership+
   (sourceDate?'<small>Bronnen gecontroleerd: '+esc(sourceDate)+'</small>':'')+'</div>'+
   '<div class="ol-dir-meta"><span class="ol-dir-badge '+m.kind+' ol-dir-'+tone(m)+'">'+esc(status(m))+'</span>'+
   (m.ratingLink?'<a href="'+esc(m.ratingLink)+'" target="_blank" rel="noopener noreferrer">Politieke rating: AllSides ↗</a>':'')+
   (m.orientationLink?'<a href="'+esc(m.orientationLink)+'" target="_blank" rel="noopener noreferrer">Redactionele oriëntatie: Eurotopics ↗</a>':'')+
   (!m.link?'<small>Politieke beoordeling onbekend; niet automatisch midden</small>':'')+
   '</div></article>';
 }).join('');
 const summary=ui.archive.summary||{};
 const ready=ui.archive.state==='ready',archiveStatus=ready?
  'Laatst geslaagde database-import: '+(summary.lastSuccess?new Date(summary.lastSuccess).toLocaleString('nl-NL'):'onbekend'):
  'Historische database momenteel niet bereikbaar';
 const body=document.getElementById('content');if(!body)return;
 body.innerHTML='<div class="ol-dir-page"><header class="ol-dir-hero"><div><span class="ol-dir-kicker">OPENLENS / SOURCE INTELLIGENCE</span>'+
 '<h1>Wie zit er achter het nieuws?</h1><p>Ontdek eigenaarschap, redactionele oriëntatie en aantoonbare berichtgeving. Controleer de oorspronkelijke bron voor elk profiel.</p></div>'+
 '<button type="button" data-view="dashboard" class="ol-dir-button">Terug naar nieuws ↗</button></header>'+
 '<div class="ol-dir-stats">'+
 [['Uitgevers in overzicht',list.length],['Geverifieerde eigendomslinks',owners],
  ['Uitgevers in archief of feed',liveCount],['Unieke archiefartikelen',ready?Number(summary.articles)||0:'—']].map(([k,v])=>'<div><strong>'+esc(v)+'</strong><span>'+k+'</span></div>').join('')+
 '</div>'+
 '<div class="ol-dir-explain"><strong>Wat betekent dit?</strong> Een eigendomsrelatie is niet hetzelfde als een politieke voorkeur. AllSides beoordeelt specifieke nieuwsmerken; Eurotopics beschrijft redactionele oriëntaties met een andere methode. De twee schalen worden <strong>niet samengevoegd</strong>. Een ontbrekende beoordeling is niet automatisch midden.</div>'+
 '<div class="ol-dir-live-status"><div><strong>Neon-nieuwsarchief</strong><p>'+esc(archiveStatus)+
  (ready?' · '+esc(summary.publishers||0)+' uitgevers aangetroffen.':'')+'</p>'+
  '<small>Unieke nieuwslinks uit een onvolledige steekproef. Niet alle catalogusuitgevers worden actief gevolgd.</small></div>'+
  '<button class="ol-dir-button" type="button" id="ol-dir-refresh" '+(ui.loading?'disabled':'')+'>'+
  (ui.loading?'Bronnen ophalen…':'↻ Controleer actuele feeds')+'</button></div>'+
 (ui.error?'<p class="ol-dir-foot">'+esc(ui.error)+'</p>':'')+
 surveyBar(list)+
 '<p class="ol-dir-foot">De verdeling hierboven telt <strong>waargenomen</strong> uitgevers, inclusief onbekende oriëntaties. Onvoldoende bronclassificatie blijft expliciet zichtbaar. Ontbrekende media zijn geen bewezen blinde vlekken.</p>'+
 '<section class="ol-dir-panel"><div class="ol-dir-toolbar"><div><h2>Uitgeversregister</h2><p>Zoek op merk, eigendomsgroep of soort redactie.</p></div>'+
 '<label>Zoek uitgever<input id="ol-dir-search" placeholder="Naam, mediagroep of type" value="'+esc(ui.query)+'" autocomplete="off"></label></div>'+
 '<div style="margin:10px 0"><label for="ol-dir-region">Regio: </label><select id="ol-dir-region" class="filter">'+
 [['all','Alle regio’s'],['nl','Nederland'],['eu','Europa / EU'],['world','Wereld'],['other','Overige']].map(([k,v])=>'<option value="'+k+'" '+(ui.region===k?'selected':'')+'>'+v+'</option>').join('')+'</select></div>'+
 '<div class="ol-dir-filters" role="group" aria-label="Filter uitgevers">'+
 [['all','Alles'],['rated','Met onafhankelijke beoordeling'],['unrated','Niet beoordeeld'],['institution','Instellingen'],['live','Aangetroffen in feeds of archief']].map(([k,v])=>
 '<button type="button" data-ol-dir-filter="'+k+'" aria-pressed="'+(ui.filter===k)+'">'+v+'</button>').join('')+
 '</div><div class="ol-dir-head"><span>Uitgever en eigenaarschap</span><span>Beoordeling met bron</span></div>'+
 '<div id="ol-dir-list">'+rows+'</div><div class="ol-dir-end"><span id="ol-dir-count" aria-live="polite"></span>'+
 '<button id="ol-dir-more" type="button">Toon meer uitgevers</button></div></section>'+
 '<p class="ol-dir-foot">Alle politieke labels zijn bronbeoordelingen van uitgevers en geen verificatie van individuele berichten. Datums en groepsgegevens kunnen veranderen: controleer de gekoppelde bron.</p></div>';
 const breadcrumb=document.getElementById('breadcrumb');if(breadcrumb)breadcrumb.textContent='Uitgevers';
 filter();
}
function filter(){
 const all=[...document.querySelectorAll('#ol-dir-list .ol-dir-row')];if(!all.length)return;
 const matches=all.filter(r=>(ui.region==='all'||r.dataset.olDirRegion===ui.region)&&(ui.filter==='all'||r.dataset.olDirKind===ui.filter||(ui.filter==='live'&&r.dataset.olDirLive==='true'))&&r.dataset.olDirName.includes(normal(ui.query)));
 const max=ui.expanded||ui.query?matches.length:Math.min(65,matches.length);
 const shown=new Set(matches.slice(0,max));for(const row of all)row.hidden=!shown.has(row);
 const label=document.getElementById('ol-dir-count');if(label)label.textContent='Showing '+shown.size+' of '+matches.length+' matching sources';
 const btn=document.getElementById('ol-dir-more');
 if(btn){btn.hidden=!!ui.query||matches.length<=65;btn.textContent=ui.expanded?'Show fewer sources':'Show all '+matches.length+' sources'}
 for(const button of document.querySelectorAll('[data-ol-dir-filter]'))button.setAttribute('aria-pressed',String(button.dataset.olDirFilter===ui.filter));
}
const prior=render;render=function(){prior();if(state.view==='publishers'){markup();if(!ui.started){ui.started=true;loadCatalog();loadEvidence()}}};
document.addEventListener('input',e=>{if(e.target?.id==='ol-dir-search'){ui.query=e.target.value.slice(0,180);filter()}});
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('[data-ol-dir-filter]');
 if(btn){ui.filter=btn.dataset.olDirFilter;ui.expanded=false;filter()}
 if(e.target.closest?.('#ol-dir-more')){ui.expanded=!ui.expanded;filter()}
 if(e.target.closest?.('#ol-dir-refresh')){loadEvidence();scan(true)}
});
document.addEventListener('change',e=>{if(e.target?.id==='ol-dir-region'){ui.region=e.target.value;ui.expanded=false;filter()}});
document.addEventListener('openlens:profiles-ready',()=>{if(state.view==='publishers')markup()});
})();
