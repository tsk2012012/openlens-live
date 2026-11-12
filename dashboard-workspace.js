/* OpenLens unified dashboard workspace — no sidebar, preserves existing user data. */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function watches(){
 try{const value=JSON.parse(localStorage.getItem('openlens.story-watch.v1')||'null');
  return Array.isArray(value?.items)?value.items.filter(x=>x&&typeof x.title==='string'):[];
 }catch{return []}
}
function ensureHeader(){
 if(document.querySelector('.ol-unified-header'))return;
 const el=document.createElement('header');el.className='ol-unified-header';
 el.innerHTML='<div class="ol-unified-inner">'+
  '<a class="ol-unified-brand" href="/" aria-label="OpenLens startpagina">'+
  '<img src="/favicon.svg" width="33" height="33" alt="" aria-hidden="true"><span>OpenLens<small>News intelligence</small></span></a>'+
  '<nav class="ol-unified-nav" aria-label="Hoofdnavigatie">'+
   '<button type="button" data-view="dashboard">Nieuws</button>'+
   '<button type="button" data-view="publishers">Uitgevers</button>'+
   '<button type="button" data-view="blindspots">Blinde vlekken</button>'+
   '<button type="button" data-ol-workspace-jump>Mijn werkruimte</button>'+
  '</nav>'+
  '<div class="ol-unified-actions"><span class="ol-unified-status"></span><span class="ol-archive-status" role="status" aria-live="polite" title="Status van het historische nieuwsarchief">Archief controleren…</span>'+
   '<button type="button" class="ol-theme-toggle ol-top-theme" data-ol-theme-toggle aria-label="Wissel licht/donker">☾ Donker</button>'+
   '<details class="ol-unified-more"><summary>Meer ▾</summary>'+
    '<div class="ol-unified-menu">'+
      '<button type="button" data-view="saved">Bewaarde artikelen<small>Je eigen leeslijst</small></button>'+
      '<button type="button" data-view="watch">Gevolgde onderwerpen<small>Controleer nieuwe berichtgeving</small></button>'+
      '<button type="button" data-view="methods">Werkwijze<small>Hoe vergelijken we bronnen?</small></button>'+
      '<button type="button" data-view="claims">Onderzoeksnotities<small>Vragen en bronnen bijhouden</small></button>'+
      '<button type="button" data-view="reviews">Redactioneel onderzoek<small>Eigen bronbeoordelingen documenteren</small></button>'+
    '</div></details>'+
  '</div></div>';
 document.querySelector('.workspace')?.prepend(el);
}
function updateHeader(){
 const header=document.querySelector('.ol-unified-header');if(!header)return;
 header.querySelectorAll('.ol-unified-nav [data-view]').forEach(b=>{
  if(b.dataset.view===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 });
 const status=header.querySelector('.ol-unified-status');
 if(status){status.textContent=state.mode==='live'?'Actuele nieuwssteekproef':state.mode==='cached'?'Bewaarde feed':'Demonstratiegegevens';status.classList.toggle('demo',state.mode==='demo')}
 const theme=header.querySelector('.ol-top-theme');
 if(theme){const dark=document.documentElement.dataset.olTheme==='dark';theme.innerHTML=dark?'☀︎ Licht':'☾ Donker';theme.setAttribute('aria-pressed',String(dark))}
}
let archiveCheckedAt=0,archiveFetching=false;
async function updateArchiveStatus(){
 const el=document.querySelector('.ol-archive-status');
 if(!el||archiveFetching||Date.now()-archiveCheckedAt<300000)return;
 archiveCheckedAt=Date.now();archiveFetching=true;
 try{
  const r=await fetch('/api/storage-status',{cache:'no-store'});
  const info=await r.json();
  const fmt=n=>Number(n||0).toLocaleString('nl-NL');
  const label=info.state==='collecting'?'Archief · '+fmt(info.articles)+' artikelen / '+fmt(info.publishers)+' uitgevers':
   info.state==='waiting_for_first_ingest'?'Archief verbonden · eerste import volgt':
   info.state==='not_connected'?'Archief niet gekoppeld':'Archiefstatus tijdelijk onbekend';
  el.textContent=label;el.dataset.state=info.state||'unavailable';
  el.title=info.lastSuccess?'Laatste geslaagde import: '+new Date(info.lastSuccess).toLocaleString('nl-NL'):'Nog geen succesvolle database-import bevestigd';
 }catch{
  el.textContent='Archiefstatus niet beschikbaar';el.dataset.state='unavailable';
 }finally{archiveFetching=false}
}
function cardHeader(title,count,description){
 return '<div class="ol-workspace-card-head"><div><h2>'+title+'</h2><p>'+description+'</p></div><span class="ol-workspace-count">'+count+'</span></div>';
}
function overview(){
 const saved=Array.isArray(state.saved)?state.saved:[],followed=watches();
 const savedList=saved.slice(0,2).map(x=>'<button class="ol-workspace-item" type="button" data-action="restore:'+esc(x.id)+'" title="Open bewaard artikel">'+esc(x.title)+'</button>').join('');
 const watchList=followed.slice(0,2).map(x=>'<button class="ol-workspace-item" type="button" data-view="watch" title="Open gevolgde onderwerpen">'+esc(x.title)+(Number(x.newCount)>0?' <small>+'+Math.max(0,Number(x.newCount))+' nieuw</small>':'')+'</button>').join('');
 return '<section class="ol-workspace-tools" id="ol-workspace-tools" aria-label="Mijn nieuwsruimte">'+
  '<div class="ol-workspace-card">'+cardHeader('Bewaarde artikelen',saved.length,'Interessant artikel? Kies Bewaar op de nieuwskaart.')+
   '<div class="ol-workspace-items">'+(savedList||'<p>Je leeslijst is nog leeg. Bewaar een artikel om het later terug te vinden.</p>')+'</div>'+
   '<div class="ol-workspace-buttons"><button type="button" data-view="saved">Bekijk leeslijst</button></div></div>'+
  '<div class="ol-workspace-card">'+cardHeader('Updates volgen',followed.length,'Volg één nieuwsverhaal en controleer later nieuwe bronnen.')+
   '<div class="ol-workspace-items">'+(watchList||'<p>Volg een verhaal via de knop bij de headline. Je kunt ook zelf een onderwerp toevoegen.</p>')+'</div>'+
   '<div class="ol-workspace-buttons"><button type="button" data-view="watch">Gevolgde verhalen</button></div></div>'+
  '<div class="ol-workspace-card ol-workspace-research">'+cardHeader('Brononderzoek','↗','Extra hulpmiddelen, alleen als je ze nodig hebt.')+
   '<div class="ol-workspace-items"><button type="button" data-view="publishers">Uitgevers vergelijken</button>'+
   '<button type="button" data-view="blindspots">Blinde vlekken</button>'+
   '<button type="button" data-view="methods">Methodiek</button></div>'+
   '<div class="ol-workspace-buttons"><button type="button" class="ol-workspace-muted" data-view="claims">Onderzoeksnotities</button>'+
   '<button type="button" class="ol-workspace-muted" data-view="reviews">Redactioneel onderzoek</button></div></div>'+
 '</section>';
}
function injectDashboard(){
 if(state.view!=='dashboard')return;
 const hero=document.querySelector('.ol-newsroom .ol-newsroom-hero');if(!hero)return;
 document.getElementById('ol-workspace-tools')?.remove();
 hero.insertAdjacentHTML('afterend',overview());
}
const previous=render;
render=function(){previous();ensureHeader();updateHeader();injectDashboard();updateArchiveStatus()};
document.addEventListener('click',e=>{
 if(e.target.closest('[data-ol-workspace-jump]')){
  e.preventDefault();e.stopImmediatePropagation();
  if(document.querySelector('.ol-reader')&&typeof window.OpenLensCloseStory==='function')window.OpenLensCloseStory();
  if(state.view!=='dashboard'){state.view='dashboard';render()}
  document.getElementById('ol-workspace-tools')?.scrollIntoView({behavior:'smooth',block:'start'});
  return;
 }
 if(e.target.closest('.ol-unified-menu [data-view]')){
  document.querySelector('.ol-unified-more')?.removeAttribute('open');
 }
});
ensureHeader();updateHeader();injectDashboard();
})();