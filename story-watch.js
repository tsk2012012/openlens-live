/* OpenLens Story Watch — user-initiated searches with local-only watchlist. */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const KEY='openlens.story-watch.v1',LIMIT=24,MAX_SEEN=600;
const ESCAPE=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STOP=new Set('de het een en van voor met naar over door op om uit als zijn is wordt bij dat die deze dit er in aan te tot ook wat wie waarom the a an and for from this that into about over after with were which when where has had have news nieuws update live'.split(' '));
const terms=v=>[...new Set((String(v||'').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]*/gu)||[]).filter(x=>x.length>=3&&!STOP.has(x)))];
const normalizeQuery=v=>terms(v).slice(0,7).join(' ').slice(0,120);
const validQuery=v=>terms(v).length>=2;
const safeUrl=v=>{try{const p=new URL(v);return p.protocol==='https:'&&p.hostname.includes('.')&&p.username===''&&p.password===''?p.href:null}catch{return null}};
const uid=()=> 'watch-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
let checkingAll=false,watchItems=[],storageEnabled=true;
try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');if(Array.isArray(raw.items))watchItems=raw.items.filter(x=>x&&typeof x.title==='string'&&typeof x.query==='string'&&Array.isArray(x.seen)).slice(0,LIMIT)}catch{storageEnabled=false}
function save(){
 try{localStorage.setItem(KEY,JSON.stringify({version:1,updatedAt:new Date().toISOString(),items:watchItems}));storageEnabled=true;return true}
 catch{storageEnabled=false;return false}
}
const find=id=>watchItems.find(w=>w.id===id);
const date=v=>v&&Number.isFinite(Date.parse(v))?new Date(v).toLocaleString():'Not checked';
const short=(v,max=100)=>String(v??'').trim().slice(0,max);
const currentQuery=s=>normalizeQuery(s.title).split(' ').slice(0,5).join(' ');
function newWatch(title,query,topic,initial=[]){
 const fixed=normalizeQuery(query||title);
 if(!validQuery(fixed)){toast('Use at least two specific keywords for Story Watch.');return null}
 const name=short(title,180);
 if(name.length<4){toast('Give the story a descriptive name.');return null}
 if(watchItems.some(w=>w.title.toLocaleLowerCase()===name.toLocaleLowerCase())){toast('This issue is already on Story Watch.');return null}
 if(watchItems.length>=LIMIT){toast('Story Watch has reached its 24-item limit. Remove a watch before adding another.');return null}
 const seen=[...new Set(initial.filter(x=>safeUrl(x)).map(x=>safeUrl(x)))].slice(0,120);
 const w={id:uid(),title:name,query:fixed,topic:short(topic||'Public affairs',45),createdAt:new Date().toISOString(),
  lastChecked:null,seen,results:[],newCount:0,lastFound:0,checks:0,lastError:null};
 watchItems.unshift(w);save();return w;
}
function fromStory(id){
 const story=state.stories.find(s=>s.id===id);
 if(!story||story.demo){toast('Only live or saved publisher stories can be watched.');return}
 const w=newWatch(story.title,currentQuery(story),story.topic,story.articles.map(a=>a.url).filter(Boolean));
 if(w){state.view='watch';render();window.scrollTo({top:0,behavior:'auto'});}
}
function addNav(){
 const nav=document.querySelector('.sidebar nav'),pub=nav?.querySelector('[data-view="publishers"]');
 if(!nav||!pub||nav.querySelector('[data-view="watch"]'))return;
 const b=document.createElement('button');b.className='nav-btn';b.type='button';b.dataset.view='watch';
 b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg> Story Watch';
 b.title='Track topics and manually check for newly discovered coverage';
 pub.after(b);
}
function watchButton(storyId){
 const b=document.createElement('button');b.type='button';b.className='ol-watch-visit-btn';
 b.dataset.olWatchStory=storyId;
 const s=state.stories.find(a=>a.id===storyId);
 const already=s&&watchItems.some(w=>w.title.toLocaleLowerCase()===s.title.toLocaleLowerCase());
 b.textContent=already?'Watching ✓':'+ Watch story';
 b.classList.toggle('active',Boolean(already));return b;
}
function enhanceStories(){
 if(state.view!=='dashboard')return;
 for(const card of document.querySelectorAll('.ol-feed-card')){
  if(card.querySelector('[data-ol-watch-story]'))continue;
  const id=card.querySelector('[data-ol-open-story]')?.dataset.olOpenStory;
  if(!id)continue;
  const row=card.querySelector('.ol-feed-actions');
  if(row)row.prepend(watchButton(id));
 }
 const reader=document.querySelector('.ol-reader');
 if(reader){
  const id=state.selected,s=state.stories.find(a=>a.id===id);
  const actions=reader.querySelector('.ol-reader-actions');
  if(s&&actions&&!actions.querySelector('[data-ol-watch-story]'))actions.prepend(watchButton(id));
 }
}
const resultMarkup=r=>{
 const url=safeUrl(r.url),when=r.when?date(r.when):'Date not provided';
 if(!url)return '';
 return '<div class="ol-watch-result"><small>'+ESCAPE(r.source||'Publisher')+' · '+ESCAPE(when)+' · '+ESCAPE(r.locale||'')+'</small>'+
 '<a href="'+ESCAPE(url)+'" target="_blank" rel="noopener noreferrer">'+ESCAPE(r.title||'Article')+' ↗</a>'+
 '<span class="ol-watch-tag">Keyword match · not independently confirmed as the same event</span></div>';
};
function watchCard(w){
 const isPending=w.checking===true,unread=Number(w.newCount||0),available=Array.isArray(w.results)?w.results:[];
 const status=unread?'<span class="ol-watch-state new">'+unread+' newly found</span>':
 '<span class="ol-watch-state">'+(w.lastChecked?'Checked':'Not checked yet')+'</span>';
 const news=available.slice(0,12).map(resultMarkup).join('');
 return '<article class="ol-watch-card"><div class="ol-watch-card-head"><div><span class="ol-watch-topic">'+ESCAPE(w.topic)+'</span><h3>'+ESCAPE(w.title)+'</h3></div>'+status+'</div>'+
 '<p class="ol-watch-keywords"><strong>Search keywords:</strong> '+ESCAPE(w.query)+'</p>'+
 '<p class="ol-watch-meta">Last checked: '+ESCAPE(date(w.lastChecked))+' · '+(w.lastFound||0)+' matching links on latest search</p>'+
 (w.lastError?'<p class="ol-watch-error">'+ESCAPE(w.lastError)+'</p>':'')+
 '<div class="ol-watch-actions">'+
 '<button type="button" class="ol-watch-btn primary" data-ol-check="'+ESCAPE(w.id)+'"'+(isPending?' disabled':'')+'>'+(isPending?'Checking…':'↻ Check for coverage')+'</button>'+
 '<button type="button" class="ol-watch-btn" data-ol-edit="'+ESCAPE(w.id)+'">Edit keywords</button>'+
 '<button type="button" class="ol-watch-btn danger" data-ol-remove="'+ESCAPE(w.id)+'">Remove</button></div>'+
 (w.editing?'<form data-ol-edit-query="'+ESCAPE(w.id)+'" class="ol-watch-field"><label>Update keywords (resets matching baseline)<input name="query" value="'+ESCAPE(w.query)+'" required maxlength="120"></label><button class="ol-watch-btn" type="submit">Save keywords</button></form>':'')+
 (available.length?'<details class="ol-watch-history"'+(unread?' open':'')+'><summary>Latest '+available.length+' potential matches'+(unread?' · '+unread+' new':'')+'</summary>'+news+'</details>':
 '<p class="ol-watch-small">Newly discovered articles will appear here after a check. Existing article links from the original story are counted as already seen.</p>')+
 '</article>';
}
function watchPage(){
 const active=watchItems.filter(w=>w.newCount>0).length,newLinks=watchItems.reduce((sum,w)=>sum+(w.newCount||0),0);
 const content=document.getElementById('content');if(!content)return;
 content.innerHTML='<div class="ol-watch-page"><header class="ol-watch-hero"><div><span class="ol-watch-eyebrow">TRACK WHAT CHANGES</span><h1>Story Watch</h1>'+
 '<p>Keep track of public-affairs stories and manually check Dutch and European feeds for newly discovered links. No automated alerts or article-level fact-checking.</p></div>'+
 '<div class="ol-watch-buttons"><button class="ol-watch-btn primary" type="button" data-ol-check-all'+(checkingAll?' disabled':'')+'>'+(checkingAll?'Checking…':'↻ Check all watches')+'</button>'+
 '<button class="ol-watch-btn" type="button" data-ol-export>Export watchlist</button></div></header>'+
 '<div class="ol-watch-stat-row"><div class="ol-watch-stat"><strong>'+watchItems.length+'</strong><span>Topics followed</span></div>'+
 '<div class="ol-watch-stat"><strong>'+active+'</strong><span>Topics with new matches</span></div>'+
 '<div class="ol-watch-stat"><strong>'+newLinks+'</strong><span>New links on latest checks</span></div></div>'+
 '<div class="ol-watch-layout"><section class="ol-watch-panel"><h2>Follow a policy issue</h2>'+
 '<p>For example: “woningbouw kabinet”, “EU migratie pact” or “belastingplan 2027”. Choose distinct search terms, not just a broad subject.</p>'+
 '<form data-ol-watch-add><label class="ol-watch-field">Name<input name="title" maxlength="180" required placeholder="e.g. Housing legislation in the Netherlands"></label>'+
 '<label class="ol-watch-field">Search keywords<input name="query" maxlength="120" required placeholder="woningbouw kabinet"></label>'+
 '<label class="ol-watch-field">Topic<select name="topic"><option>Dutch politics</option><option>EU policy</option><option>Housing</option><option>Migration</option><option>Public finances</option><option>Geopolitics</option><option>Other public affairs</option></select></label>'+
 '<button class="ol-watch-btn primary" type="submit">+ Follow issue</button></form>'+
 '<p class="ol-watch-small">'+(storageEnabled?'Your watchlist is stored only in this browser.':'Local storage unavailable; export your research before closing this page.')+'</p></section>'+
 '<section class="ol-watch-panel"><h2>Followed stories & issues</h2><p>Checks search recent headlines in Dutch and English. A new link is a possible match, not proof that the underlying story has changed.</p>'+
 (watchItems.length?watchItems.map(watchCard).join(''):'<div class="ol-watch-empty"><h3>Nothing tracked yet</h3><p>Use “Watch story” when reading an article comparison, or add a public-affairs issue here.</p></div>')+
 '</section></div><div class="ol-watch-help"><strong>How Story Watch works:</strong> It checks Google News RSS in Dutch and English when you press Check, then compares returned links against those already seen for this watch. The results can include loosely related articles; open the publisher sources and verify the event yourself. This is not continuous background monitoring or a notification service, and searches are not comprehensive. Some publishers may be absent or paywalled.</div></div>';
 const crumb=document.getElementById('breadcrumb');if(crumb)crumb.textContent='Story Watch';
}
async function checkWatch(id){
 const w=find(id);if(!w||w.checking)return;
 w.checking=true;w.lastError=null;if(state.view==='watch')render();
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),13500);
 try{
  const u='/api/watch?'+new URLSearchParams({q:w.query,days:'7'});
  const response=await fetch(u,{signal:ctrl.signal,headers:{Accept:'application/json'}});
  const data=await response.json();
  if(!response.ok||!Array.isArray(data.articles))throw Error(data.error||'Search temporarily unavailable');
  const needles=terms(w.query),known=new Set(w.seen||[]);
  const candidates=data.articles.filter(a=>safeUrl(a.url)&&terms(a.title).filter(t=>needles.includes(t)).length>=2);
  const added=candidates.filter(a=>!known.has(a.url));
  for(const a of candidates)known.add(a.url);
  w.seen=[...known].slice(-MAX_SEEN);
  const dedup=new Map();
  for(const a of [...added,...(w.results||[])])if(!dedup.has(a.url))dedup.set(a.url,{
   title:short(a.title,310),url:a.url,source:short(a.source,160),when:a.when,locale:a.locale});
  w.results=[...dedup.values()].slice(0,35);
  w.newCount=added.length;w.lastFound=candidates.length;w.lastChecked=data.fetchedAt||new Date().toISOString();
  w.checks=(w.checks||0)+1;w.lastError=null;
 }catch(e){w.lastError=e.name==='AbortError'?'Search timed out. Try again.':short(e.message||'Could not check sources.',200)}
 finally{clearTimeout(timer);w.checking=false;save();if(state.view==='watch')render()}
}
async function checkAll(){
 if(checkingAll||!watchItems.length)return;
 checkingAll=true;render();
 const pending=watchItems.slice(0,8).map(w=>w.id);
 for(let i=0;i<pending.length;i+=2)await Promise.all(pending.slice(i,i+2).map(checkWatch));
 checkingAll=false;render();
 if(watchItems.length>8)toast('Checked the first eight watches. Check remaining watches individually.');
}
const originalRender=render;
render=function(){
 originalRender();addNav();
 const btn=document.querySelector('.sidebar [data-view="watch"]');
 if(btn)btn.classList.toggle('active',state.view==='watch');
 if(state.view==='watch')watchPage();
 if(state.view==='dashboard')enhanceStories();
};
document.addEventListener('click',e=>{
 const el=e.target.closest?.('[data-ol-watch-story],[data-ol-check],[data-ol-edit],[data-ol-remove],[data-ol-check-all],[data-ol-export]');
 if(!el)return;
 if(el.dataset.olWatchStory){e.preventDefault();e.stopImmediatePropagation();fromStory(el.dataset.olWatchStory);return}
 if(el.dataset.olCheck){checkWatch(el.dataset.olCheck);return}
 if(el.hasAttribute('data-ol-check-all')){checkAll();return}
 if(el.dataset.olEdit){const w=find(el.dataset.olEdit);if(w){w.editing=!w.editing;render()}return}
 if(el.dataset.olRemove){
  const w=find(el.dataset.olRemove);
  if(w&&window.confirm('Remove this watch and its locally stored search history?')){
   watchItems=watchItems.filter(x=>x.id!==w.id);save();render();
  }return
 }
 if(el.hasAttribute('data-ol-export')){
  const blob=new Blob([JSON.stringify({app:'OpenLens Story Watch',version:1,exportedAt:new Date().toISOString(),items:watchItems},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='openlens-story-watch.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1300);
 }
},true);
document.addEventListener('submit',e=>{
 const form=e.target.closest?.('[data-ol-watch-add],[data-ol-edit-query]');
 if(!form)return;
 e.preventDefault();
 const data=new FormData(form);
 if(form.hasAttribute('data-ol-watch-add')){
  const w=newWatch(data.get('title'),data.get('query'),data.get('topic'));
  if(w){render();toast('Issue added. Press Check for coverage to find new links.')}
 }else{
  const w=find(form.dataset.olEditQuery);if(!w)return;
  const query=normalizeQuery(data.get('query'));
  if(!validQuery(query)){toast('Enter two or more distinctive keywords.');return}
  if(w.query!==query){w.query=query;w.seen=[];w.results=[];w.newCount=0;w.lastChecked=null}
  w.editing=false;save();render();
 }
});
addNav();
if(state.view==='dashboard')enhanceStories();
})();
