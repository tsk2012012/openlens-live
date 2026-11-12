/* A publisher directory for sources in the current news sample. */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui={query:'',filter:'all',region:'all',expanded:false,groups:{},discovered:[],updated:null,loading:false,started:false,error:''};
const safeLink=raw=>{try{const u=new URL(raw);return u.protocol==='https:'&&/(^|\.)(allsides\.com|eurotopics\.net)$/i.test(u.hostname)?u.href:null}catch{return null}};

const regionNames={nl:'Nederland',eu:'Europa / EU',world:'Wereld',other:'Overige'};
const normal=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cacheKey='openlens.publisher.discovery.v2';
try{const c=JSON.parse(localStorage.getItem(cacheKey)||'null');if(c){ui.discovered=Array.isArray(c.names)?c.names:[];ui.updated=c.updated||null}}catch{}
async function loadCatalog(){
 try{const r=await fetch('/publisher-catalog.json');if(!r.ok)throw Error('catalog unavailable');const d=await r.json();ui.groups=d.groups||{};if(state.view==='publishers')markup()}catch(e){ui.error='Catalogusbestand niet beschikbaar';if(state.view==='publishers')markup()}
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
 const add=(n,region,live=false,when=null)=>{if(typeof n!=='string'||!n.trim()||/^unknown/i.test(n))return;const key=normal(n);const old=names.get(key);if(old){if(live){old.live=true;if(when)old.when=when}return}names.set(key,{name:n,region,live,when})};
 for(const region of ['nl','eu','world'])for(const name of ui.groups[region]||[])add(name,region);
 for(const a of state.allArticles||[])add(typeof sourceInfo==='function'?sourceInfo(a)?.name:a.source,'other',true,a.when);
 for(const a of ui.discovered)add(a.name,a.region||'other',true,a.when);
 return [...names.values()].sort((a,b)=>a.name.localeCompare(b.name,'nl',{sensitivity:'base'})).map(entry=>{const name=entry.name;
  const meta=window.OpenLensSourceAudit?.lookup(name)||null;
  const external=window.OpenLensPublisherRatingLookup?.(name)||null;
  const institutional=meta?.politicallyAssessable===false;
  const euro=window.OpenLensPublisherOrientationLookup?.(name)||null;
  const rawRating=external?.rating&&!['Unrated','Other source'].includes(external.rating)?external.rating:meta?.rating||null;
  const ratingLink=safeLink(external?.source||meta?.source),orientationLink=safeLink(euro?.source);
  const rating=!institutional&&ratingLink&&['Left','Lean Left','Center','Lean Right','Right'].includes(rawRating)?rawRating:null;
  const orientation=!institutional&&orientationLink?euro?.orientation:null;
  const kind=institutional?'institution':rating||orientation?'rated':'unrated';
  return {...entry,name,kind,type:meta?.type||'Identiteit nog niet beoordeeld',rating,orientation,
    provider:external?.provider||null,link:rating?ratingLink:orientationLink,
    orientationLink:orientation?orientationLink:null,ratingLink:rating?ratingLink:null,
    note:meta?.typeExplanation||'Publisher identity has not been fully reviewed.'};
 });
}

const tone=m=>{
 const raw=m.rating||(m.orientation==='Left-wing'?'Left':m.orientation==='Centre-left'?'Lean Left':m.orientation==='Right-wing'?'Right':null);
 if(raw==='Left'||raw==='Lean Left')return 'left';
 if(raw==='Center')return 'center';
 if(raw==='Right'||raw==='Lean Right')return 'right';
 return 'other';
};
const colorStyle=document.createElement('style');
colorStyle.textContent='.ol-dir-badge.ol-dir-left{background:#dfeaff!important;color:#204b9e!important;border-left:4px solid #3c70d6}.ol-dir-badge.ol-dir-center{background:#e5ede7!important;color:#355747!important;border-left:4px solid #6b9b83}.ol-dir-badge.ol-dir-right{background:#ffe4e3!important;color:#963b3a!important;border-left:4px solid #d45e5c}.ol-dir-badge.ol-dir-other{background:#edf0f1!important;color:#455b61!important;border-left:4px solid #95a2a5}.ol-dir-legend{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0;font-size:11px;align-items:center}.ol-dir-legend span{display:inline-flex;gap:6px;align-items:center}.ol-dir-legend i{height:10px;width:10px;border-radius:3px;display:inline-block}.ol-dir-legend .left{background:#3c70d6}.ol-dir-legend .center{background:#6b9b83}.ol-dir-legend .right{background:#d45e5c}.ol-dir-legend .other{background:#95a2a5}';
document.head.append(colorStyle);
function markup(){
 const list=publishers(),rated=list.filter(x=>x.kind==='rated').length,
  orgs=list.filter(x=>x.kind==='institution').length,unrated=list.length-rated-orgs;
 const status=m=>m.kind==='institution'?'Instelling / geen nieuwsuitgever':m.rating||m.orientation||'Geen controleerbare politieke beoordeling';
 const rows=list.map(m=>
  '<article class="ol-dir-row" data-ol-dir-region="'+m.region+'" data-ol-dir-live="'+m.live+'" data-ol-dir-kind="'+m.kind+'" data-ol-dir-name="'+esc((m.name+' '+m.type).toLowerCase())+'">'+
  '<div class="ol-dir-name"><strong>'+esc(m.name)+'</strong><span>'+esc(regionNames[m.region]||'Overige')+' · '+esc(m.type)+(m.live?' · Aangetroffen in nieuwsfeed':' · Catalogus')+'</span></div>'+
  '<div class="ol-dir-meta"><span class="ol-dir-badge '+m.kind+' ol-dir-'+tone(m)+'">'+esc(status(m))+'</span>'+
  (m.ratingLink?'<a href="'+esc(m.ratingLink)+'" target="_blank" rel="noopener noreferrer">AllSides / bronprofiel ↗</a>':'')+(m.orientationLink?'<a href="'+esc(m.orientationLink)+'" target="_blank" rel="noopener noreferrer">Eurotopics ↗</a>':'')+(!m.link?'<small>Geen beoordeling beschikbaar</small>':'')+
  '</div></article>').join('');
 const body=document.getElementById('content');if(!body)return;
 body.innerHTML='<div class="ol-dir-page"><header class="ol-dir-hero"><div><span class="ol-dir-kicker">SOURCE INTELLIGENCE</span><h1>Uitgevers & politieke bronprofielen</h1>'+
 '<p>Een onafhankelijke catalogus naast de actuele nieuwsfeed. Alleen politieke classificaties met controleerbare bronnen worden weergegeven.</p></div>'+
 '<button type="button" data-view="dashboard" class="ol-dir-button">Explore stories ↗</button></header>'+
 '<div class="ol-dir-stats">'+
 [['Uitgevers in catalogus',list.length],['Met bronbeoordeling',rated],['Zonder score',unrated],['Aangetroffen in nieuwsfeeds',list.filter(x=>x.live).length]].map(([k,v])=>'<div><strong>'+v+'</strong><span>'+k+'</span></div>').join('')+
 '</div><div class="ol-dir-explain"><strong>What these labels mean:</strong> Newsroom political ratings come from cited external assessments, not OpenLens guesses. Government bodies, research groups and other institutions are grouped by source type. Unrated does not mean Center. A Eurotopics editorial-orientation profile (e.g. Liberal or Christian) need not map to Left–Right. AllSides and Eurotopics use different methodologies. This directory represents the current feed, not the entire news ecosystem.</div>'+
 '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 0"><button class="ol-dir-button" type="button" id="ol-dir-refresh" '+(ui.loading?'disabled':'')+'>↻ '+(ui.loading?'Nieuwsfeeds worden opgehaald…':'Ververs uitgevers uit NL, EU en Wereld')+'</button><small>'+esc(ui.error||('Laatste scan: '+(ui.updated?new Date(ui.updated).toLocaleString('nl-NL'):'nog niet uitgevoerd')))+'</small></div>'+
 '<p class="ol-dir-foot">Deze uitgebreide catalogus bevat ook namen die nog niet zijn gevonden in de live feeds. De scan draait bij openen en op verzoek, niet voortdurend op de achtergrond. AllSides en Eurotopics worden niet live gesynchroniseerd.</p>'+
 '<div class="ol-dir-legend" aria-label="Kleurlegenda"><span><i class="left"></i>Links</span><span><i class="center"></i>Midden</span><span><i class="right"></i>Rechts</span><span><i class="other"></i>Niet op links-rechtsschaal</span></div>'+ 
 '<section class="ol-dir-panel"><div class="ol-dir-toolbar"><div><h2>Browse sources</h2><p>Search a publisher or explore its source category.</p></div>'+
 '<label>Search publishers<input id="ol-dir-search" placeholder="Search by name or source type" value="'+esc(ui.query)+'" autocomplete="off"></label></div>'+
 '<div style="margin:10px 0"><label for="ol-dir-region">Regio: </label><select id="ol-dir-region" class="filter">'+[['all','Alle regio’s'],['nl','Nederland'],['eu','Europa / EU'],['world','Wereld'],['other','Overige']].map(([k,v])=>'<option value="'+k+'" '+(ui.region===k?'selected':'')+'>'+v+'</option>').join('')+'</select></div>'+
 '<div class="ol-dir-filters" role="group" aria-label="Publisher rating filters">'+
 [['all','Alles'],['rated','Met bronbeoordeling'],['unrated','Geen beoordeling'],['institution','Instellingen'],['live','In nieuwsfeeds']].map(([k,v])=>
 '<button type="button" data-ol-dir-filter="'+k+'" aria-pressed="'+(ui.filter===k)+'">'+v+'</button>').join('')+
 '</div><div class="ol-dir-head"><span>Publisher / category</span><span>Assessment / reference</span></div>'+
 '<div id="ol-dir-list">'+rows+'</div><div class="ol-dir-end"><span id="ol-dir-count" aria-live="polite"></span>'+
 '<button id="ol-dir-more" type="button">Show more sources</button></div></section>'+
 '<p class="ol-dir-foot">Publisher-wide labels are not article fact-checks. Ratings can change and may cover particular political contexts. Consult each linked assessment for its scope, methodology and confidence.</p></div>';
 const breadcrumb=document.getElementById('breadcrumb');if(breadcrumb)breadcrumb.textContent='Publishers';
 filter();
}
function filter(){
 const all=[...document.querySelectorAll('#ol-dir-list .ol-dir-row')];if(!all.length)return;
 const matches=all.filter(r=>(ui.region==='all'||r.dataset.olDirRegion===ui.region)&&(ui.filter==='all'||r.dataset.olDirKind===ui.filter||(ui.filter==='live'&&r.dataset.olDirLive==='true'))&&r.dataset.olDirName.includes(ui.query.toLowerCase()));
 const max=ui.expanded||ui.query?matches.length:Math.min(65,matches.length);
 const shown=new Set(matches.slice(0,max));for(const row of all)row.hidden=!shown.has(row);
 const label=document.getElementById('ol-dir-count');if(label)label.textContent='Showing '+shown.size+' of '+matches.length+' matching sources';
 const btn=document.getElementById('ol-dir-more');
 if(btn){btn.hidden=!!ui.query||matches.length<=65;btn.textContent=ui.expanded?'Show fewer sources':'Show all '+matches.length+' sources'}
 for(const button of document.querySelectorAll('[data-ol-dir-filter]'))button.setAttribute('aria-pressed',String(button.dataset.olDirFilter===ui.filter));
}
const prior=render;render=function(){prior();if(state.view==='publishers'){markup();if(!ui.started){ui.started=true;loadCatalog();scan(false)}}};
document.addEventListener('input',e=>{if(e.target?.id==='ol-dir-search'){ui.query=e.target.value.slice(0,180);filter()}});
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('[data-ol-dir-filter]');
 if(btn){ui.filter=btn.dataset.olDirFilter;ui.expanded=false;filter()}
 if(e.target.closest?.('#ol-dir-more')){ui.expanded=!ui.expanded;filter()}
 if(e.target.closest?.('#ol-dir-refresh'))scan(true)
});
document.addEventListener('change',e=>{if(e.target?.id==='ol-dir-region'){ui.region=e.target.value;ui.expanded=false;filter()}});
})();
