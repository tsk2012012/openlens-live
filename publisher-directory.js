/* A publisher directory for sources in the current news sample. */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui={query:'',filter:'all',expanded:false};
const safeLink=raw=>{try{const u=new URL(raw);return u.protocol==='https:'&&/(^|\.)(allsides\.com|eurotopics\.net)$/i.test(u.hostname)?u.href:null}catch{return null}};
function publishers(){
 const names=new Map();
 for(const a of state.allArticles||[]){
  const n=typeof sourceInfo==='function'?sourceInfo(a)?.name:a.source;
  if(typeof n==='string'&&n.trim()&&n!=='Unknown publisher')names.set(n.toLowerCase(),n);
 }
 return [...names.values()].sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})).map(name=>{
  const meta=window.OpenLensSourceAudit?.lookup(name)||null;
  const external=window.OpenLensPublisherRatingLookup?.(name)||null;
  const institutional=meta?.politicallyAssessable===false;
  const rating=institutional?null:external?.rating&&!['Unrated','Other source'].includes(external.rating)?external.rating:meta?.rating||null;
  const kind=institutional?'institution':rating?'rated':'unrated';
  return {name,kind,type:meta?.type||'Identity not reviewed',rating,orientation:window.OpenLensPublisherOrientationLookup?.(name)?.orientation||null,
    provider:external?.provider||null,link:safeLink(external?.source||meta?.source||window.OpenLensPublisherOrientationLookup?.(name)?.source),
    note:meta?.typeExplanation||'Publisher identity has not been fully reviewed.'};
 });
}
function markup(){
 const list=publishers(),rated=list.filter(x=>x.kind==='rated').length,
  orgs=list.filter(x=>x.kind==='institution').length,unrated=list.length-rated-orgs;
 const status=m=>m.kind==='institution'?'Institutional / non-news source':m.rating||'No independent political rating';
 const rows=list.map(m=>
  '<article class="ol-dir-row" data-ol-dir-kind="'+m.kind+'" data-ol-dir-name="'+esc((m.name+' '+m.type).toLowerCase())+'">'+
  '<div class="ol-dir-name"><strong>'+esc(m.name)+'</strong><span>'+esc(m.type)+(m.orientation?' · Eurotopics: '+esc(m.orientation):'')+'</span></div>'+
  '<div class="ol-dir-meta"><span class="ol-dir-badge '+m.kind+'">'+esc(status(m))+'</span>'+
  (m.link?'<a href="'+esc(m.link)+'" target="_blank" rel="noopener noreferrer">Rating source ↗</a>':'<small>—</small>')+
  '</div></article>').join('');
 const body=document.getElementById('content');if(!body)return;
 body.innerHTML='<div class="ol-dir-page"><header class="ol-dir-hero"><div><span class="ol-dir-kicker">SOURCE INTELLIGENCE</span><h1>Publisher directory</h1>'+
 '<p>See who is behind the headlines. Political labels are sourced publisher assessments, never a measure of article truth.</p></div>'+
 '<button type="button" data-view="dashboard" class="ol-dir-button">Explore stories ↗</button></header>'+
 '<div class="ol-dir-stats">'+
 [['Sources in this feed',list.length],['With published ratings',rated],['Without a political rating',unrated],['Institutional / other',orgs]].map(([k,v])=>'<div><strong>'+v+'</strong><span>'+k+'</span></div>').join('')+
 '</div><div class="ol-dir-explain"><strong>What these labels mean:</strong> Newsroom political ratings come from cited external assessments, not OpenLens guesses. Government bodies, research groups and other institutions are grouped by source type. Unrated does not mean Center. A Eurotopics editorial-orientation profile (e.g. Liberal or Christian) need not map to Left–Right. AllSides and Eurotopics use different methodologies. This directory represents the current feed, not the entire news ecosystem.</div>'+
 '<section class="ol-dir-panel"><div class="ol-dir-toolbar"><div><h2>Browse sources</h2><p>Search a publisher or explore its source category.</p></div>'+
 '<label>Search publishers<input id="ol-dir-search" placeholder="Search by name or source type" value="'+esc(ui.query)+'" autocomplete="off"></label></div>'+
 '<div class="ol-dir-filters" role="group" aria-label="Publisher rating filters">'+
 [['all','All'],['rated','With rating'],['unrated','Not rated'],['institution','Institutional']].map(([k,v])=>
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
 const matches=all.filter(r=>(ui.filter==='all'||r.dataset.olDirKind===ui.filter)&&r.dataset.olDirName.includes(ui.query.toLowerCase()));
 const max=ui.expanded||ui.query?matches.length:Math.min(65,matches.length);
 const shown=new Set(matches.slice(0,max));for(const row of all)row.hidden=!shown.has(row);
 const label=document.getElementById('ol-dir-count');if(label)label.textContent='Showing '+shown.size+' of '+matches.length+' matching sources';
 const btn=document.getElementById('ol-dir-more');
 if(btn){btn.hidden=!!ui.query||matches.length<=65;btn.textContent=ui.expanded?'Show fewer sources':'Show all '+matches.length+' sources'}
 for(const button of document.querySelectorAll('[data-ol-dir-filter]'))button.setAttribute('aria-pressed',String(button.dataset.olDirFilter===ui.filter));
}
const prior=render;render=function(){prior();if(state.view==='publishers')markup()};
document.addEventListener('input',e=>{if(e.target?.id==='ol-dir-search'){ui.query=e.target.value.slice(0,180);filter()}});
document.addEventListener('click',e=>{
 const btn=e.target.closest?.('[data-ol-dir-filter]');
 if(btn){ui.filter=btn.dataset.olDirFilter;ui.expanded=false;filter()}
 if(e.target.closest?.('#ol-dir-more')){ui.expanded=!ui.expanded;filter()}
});
})();
