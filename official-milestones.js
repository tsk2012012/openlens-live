/* Story Watch / Official Milestones — direct parliamentary records.
 * Media matches and official records remain explicitly separate.
 * Checks run only on user actions. Previous watch storage is untouched.
 */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const KEY='openlens.story-watch.official.v1';
const SOURCE_KEY='openlens.story-watch.v1',MAX_EVENTS=40,MAX_SEEN=420;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>v&&Number.isFinite(Date.parse(v))?new Date(v).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Date unavailable';
const safeSource=v=>{
 try{const u=new URL(String(v));return u.protocol==='https:'&&
 ['gegevensmagazijn.tweedekamer.nl','eur-lex.europa.eu'].includes(u.hostname)&&!u.username&&!u.password?u.href:null}catch{return null}
};
let registry={};
try{
 const old=JSON.parse(localStorage.getItem(KEY)||'{}');
 if(old.version===1&&old.byWatch&&typeof old.byWatch==='object'&&!Array.isArray(old.byWatch))registry=old.byWatch;
}catch{}
const inflight=new Set();
const cap=(x,n=260)=>String(x??'').slice(0,n);
const loadWatches=()=>{
 try{return JSON.parse(localStorage.getItem(SOURCE_KEY)||'{}').items||[]}
 catch{return []}
};
function save(){
 try{localStorage.setItem(KEY,JSON.stringify({version:1,byWatch:registry,updatedAt:new Date().toISOString()}));return true}
 catch{return false}
}
function cleanState(){
 const items=loadWatches().slice(0,24),allowed=new Set(items.map(w=>w.id));
 let changed=false;
 for(const id of Object.keys(registry))if(!allowed.has(id)){delete registry[id];changed=true}
 if(changed)save();
 return items;
}
function recordFor(id,query){
 let record=registry[id];
 if(!record||record.query!==query){
  record={query,checkedAt:null,seen:[],events:[],newCount:0,found:0,sourceStatus:[],error:null,expanded:false};
  registry[id]=record;save();
 }
 return record;
}
const version=v=>v.id+'|'+(v.officialStatus||'')+'|'+(v.title||'')+'|'+(v.date||'');
const allowRow=v=>{
 if(!v||typeof v.id!=='string'||!/^tk-(?:activiteit|zaak|document)-[a-f0-9-]+$|^eurlex-(?:commission-proposals|eu-legislation)-[a-zA-Z0-9]+$/.test(v.id))return false;
 if(!safeSource(v.sourceUrl)||typeof v.title!=='string'||!v.title.trim()||!Number.isFinite(Date.parse(v.date)))return false;
 return ['Netherlands','European Union'].includes(v.jurisdiction);
};
function eventMarkup(r){
 const href=safeSource(r.sourceUrl);
 if(!href)return '';
 const status=r.officialStatus?' · '+esc(r.officialStatus):'';
 return '<div class="ol-official-event"><div class="ol-official-event-top">'+
 '<span class="ol-official-event-type">'+esc(r.label||r.recordType||'Official record')+'</span>'+
 '<span class="ol-official-event-time">'+esc(date(r.date))+'</span></div>'+
 '<h5>'+esc(r.title)+'</h5><p>'+esc(r.source||'Official source')+' · '+esc(r.jurisdiction||'')+status+'</p>'+
 '<p>'+esc(r.stageNote||'Record exists; procedural outcome not inferred')+'</p>'+
 '<a target="_blank" rel="noopener noreferrer" href="'+esc(href)+'">Open official source ↗</a></div>';
}
function panelHTML(id,record){
 const statuses=Array.isArray(record.sourceStatus)?record.sourceStatus:[];
 const ready=record.checkedAt&&statuses.some(s=>s.status==='ok');
 const events=Array.isArray(record.events)?record.events:[];
 const shown=record.expanded?events.slice(0,MAX_EVENTS):events.slice(0,5);
 const health=statuses.length?'<div class="ol-official-source-health">'+statuses.map(s=>'<span class="'+(s.status==='ok'?'':'missing')+'">'+
 esc((s.source||'Source')+(s.status==='ok'?' · connected':' · unavailable'))+'</span>').join('')+'</div>':'';
 const found=Number(record.found||0),news=Number(record.newCount||0);
 const error=record.error?'<div class="ol-official-error">'+esc(record.error)+'</div>':'';
 return '<div class="ol-official-panel" data-ol-official-panel="'+esc(id)+'">'+
 '<div class="ol-official-head"><div><h4>Official parliamentary & EU records</h4>'+
 '<p>Direct primary-source records, separated from media reports</p></div>'+
 '<div class="ol-official-actions">'+(news?'<span class="ol-official-pill new">'+news+' newly discovered / changed</span>':found?'<span class="ol-official-pill">'+found+' possible matches</span>':'')+
 '<button type="button" class="ol-official-button" data-ol-official-check="'+esc(id)+'"'+(inflight.has(id)?' disabled':'')+'>'+
 (inflight.has(id)?'Checking sources…':'↻ Check official records')+'</button></div></div>'+
 '<p class="ol-official-checktime">Last checked: '+esc(date(record.checkedAt))+'</p>'+health+error+
 (shown.length?'<div class="ol-official-events">'+shown.map(eventMarkup).join('')+'</div>':
 '<div class="ol-official-none">'+(record.checkedAt&&ready?'No relevant official records found in the available window. This does not mean no legislative action exists.':
  'Check the original Dutch parliamentary database and EUR-Lex feeds for potentially related activities, amendments and legislative publications.')+'</div>')+
 (events.length>5?'<button class="ol-official-more" type="button" data-ol-official-expand="'+esc(id)+'">'+
 (record.expanded?'Show fewer':'Show all '+events.length+' official matches')+'</button>':'')+
 '<p class="ol-official-disclaimer">The records are from official institutions, but <strong>relevance to your watched story is only a keyword match</strong>. A scheduled debate is not a completed decision. An amendment or Commission proposal is not enacted law. Records are retrieved on demand, not continuously monitored.</p>'+
 '</div>';
}
function enhance(){
 if(state.view!=='watch')return;
 const items=cleanState(),byId=new Map(items.map(w=>[w.id,w]));
 const cards=[...document.querySelectorAll('.ol-watch-card')];
 for(const card of cards){
  const id=card.querySelector('[data-ol-check]')?.dataset.olCheck,w=byId.get(id);
  if(!id||!w)continue;
  const record=recordFor(id,w.query);
  // Re-create only the self-owned panel, not the existing watched story or media UI.
  const prior=card.querySelector('[data-ol-official-panel]');if(prior)prior.remove();
  card.insertAdjacentHTML('beforeend',panelHTML(id,record));
  const mediaButton=card.querySelector('[data-ol-check]');
  if(mediaButton&&!mediaButton.disabled)mediaButton.textContent='↻ Check news & official records';
 }
 const stats=document.querySelector('.ol-watch-stat-row');
 if(stats&&!stats.querySelector('.ol-official-stat')){
  const div=document.createElement('div');div.className='ol-watch-stat ol-official-stat';
  const number=document.createElement('strong');
  number.textContent=String(items.reduce((n,w)=>n+(registry[w.id]?.newCount||0),0));
  const caption=document.createElement('span');caption.textContent='New / changed official records on last check';
  div.append(number,caption);stats.append(div);
 }
 const css=document.getElementById('ol-official-stat-style');
 if(!css){const style=document.createElement('style');style.id='ol-official-stat-style';style.textContent=
  '.ol-watch-stat-row{grid-template-columns:repeat(4,minmax(0,1fr))}@media(max-width:650px){.ol-watch-stat-row{grid-template-columns:repeat(2,minmax(0,1fr))}}';document.head.append(style)}
 const help=document.querySelector('.ol-watch-help');
 if(help&&!help.querySelector('.ol-official-sourcing-note')){
  const p=document.createElement('p');p.className='ol-official-sourcing-note';
  p.textContent='Official sources: Tweede Kamer OData v5 (activities, cases and documents) and EUR-Lex publication feeds. These records do not establish case-to-case links without human verification. Parliamentary decisions and European Parliament vote results are not automatically reconstructed.';
  help.append(p);
 }
}
async function checkOfficial(id){
 const item=loadWatches().find(w=>w.id===id);
 if(!item||inflight.has(id))return;
 const record=recordFor(id,item.query);
 inflight.add(id);record.error=null;if(state.view==='watch')render();
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12500);
 try{
  const response=await fetch('/api/milestones?'+new URLSearchParams({q:item.query,days:'30'}),{
   signal:ctl.signal,headers:{Accept:'application/json'}
  });
  const payload=await response.json();
  if(!response.ok||!Array.isArray(payload.events)||!Array.isArray(payload.sourceStatus))throw Error(payload.error||'Could not read official sources');
  if(!payload.sourceStatus.some(s=>s.status==='ok'))throw Error('All official sources are temporarily unavailable.');
  const rows=payload.events.filter(allowRow).slice(0,50);
  const old=new Set((record.seen||[]).slice(-MAX_SEEN)),newMatches=rows.filter(r=>!old.has(version(r)));
  for(const event of rows)old.add(version(event));
  record.seen=[...old].slice(-MAX_SEEN);
  const all=new Map();
  for(const r of [...rows,...(record.events||[])])if(!all.has(r.id))all.set(r.id,{
   id:r.id,title:cap(r.title,360),date:r.date,source:cap(r.source,100),
   sourceUrl:r.sourceUrl,recordType:cap(r.recordType,80),officialStatus:cap(r.officialStatus,50),
   stageNote:cap(r.stageNote,160),label:cap(r.label,100),jurisdiction:r.jurisdiction
  });
  record.events=[...all.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,MAX_EVENTS);
  record.newCount=newMatches.length;record.found=rows.length;
  record.sourceStatus=payload.sourceStatus.slice(0,5).map(s=>({source:cap(s.source,100),status:s.status==='ok'?'ok':'unavailable'}));
  record.checkedAt=payload.checkedAt||new Date().toISOString();record.error=null;
 }catch(e){record.error=e.name==='AbortError'?'Official source lookup timed out. Check again.':cap(e.message||'Official sources temporarily unavailable.',170)}
 finally{clearTimeout(timer);inflight.delete(id);save();if(state.view==='watch')render()}
}
const previous=render;
render=function(){previous();enhance()};
document.addEventListener('click',e=>{
 const button=e.target.closest?.('[data-ol-official-check],[data-ol-official-expand],[data-ol-check],[data-ol-check-all]');
 if(!button)return;
 const own=button.dataset.olOfficialCheck;
 if(own){checkOfficial(own);return}
 const expand=button.dataset.olOfficialExpand;
 if(expand){
  const item=loadWatches().find(w=>w.id===expand);
  const r=item&&recordFor(expand,item.query);if(r){r.expanded=!r.expanded;save();render()}return
 }
 // Existing manual news check is kept independent, so either service can fail without hiding the other.
 if(button.dataset.olCheck){checkOfficial(button.dataset.olCheck);return}
 if(button.hasAttribute('data-ol-check-all')){
  const ids=loadWatches().slice(0,8).map(w=>w.id);
  (async()=>{for(let i=0;i<ids.length;i+=2)await Promise.all(ids.slice(i,i+2).map(checkOfficial))})();
 }
},true);
if(state.view==='watch')enhance();
})();
