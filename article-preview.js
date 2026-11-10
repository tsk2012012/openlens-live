/* OpenLens article previews: linked publisher synopsis, never an invented full-text summary. */
(()=>{
'use strict';
const css=`
.ol-p-synopsis{overflow-wrap:anywhere}
.ol-p-head h2{overflow-wrap:anywhere}

.ol-preview-trigger{display:inline-flex;align-items:center;gap:5px;background:#edf2ff;border:1px solid #dce5ff;color:#3154bd;border-radius:7px;padding:6px 9px;font-size:11px;font-weight:700;line-height:1.2;font-family:inherit;cursor:pointer}
.ol-preview-trigger:hover{background:#dfe9ff}
.coverage-row h4 a{cursor:pointer;text-decoration-color:#b3c2ec;text-underline-offset:3px}
.ol-preview-dialog{box-sizing:border-box;width:min(610px,calc(100vw - 26px));max-height:min(85vh,850px);padding:0;border:1px solid #dfe5f0;border-radius:17px;box-shadow:0 20px 75px rgba(20,37,72,.22);color:#17233e;background:white;overflow:auto}
.ol-preview-dialog::backdrop{background:rgba(19,32,58,.58);backdrop-filter:blur(2px)}
.ol-p-head{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #e8ecf4;padding:20px 22px 16px;gap:14px}
.ol-p-label{font-size:10px;color:#0c7769;letter-spacing:.1em;font-weight:800;text-transform:uppercase}
.ol-p-head h2{font-size:19px;line-height:1.37;font-weight:820;margin:9px 0 9px}
.ol-p-meta{font-size:11px;color:#8793a6;line-height:1.55}
.ol-p-close{width:29px;height:29px;flex:none;border:1px solid #e1e6f1;border-radius:8px;background:#fff;color:#43506a;cursor:pointer;font-size:18px}
.ol-p-content{padding:18px 22px}
.ol-p-kind{font-size:11px;font-weight:800;color:#0c7769;margin-bottom:9px}
.ol-p-synopsis{font-size:14px;line-height:1.75;color:#26354f;white-space:pre-wrap;margin:0 0 12px}
.ol-p-note{font-size:11px;line-height:1.6;color:#667d71;border-radius:9px;background:#f1f7f2;padding:11px;margin-top:14px}
.ol-p-highlights{display:grid;gap:9px;margin:12px 0}
.ol-p-highlight{background:#f7faf6;border:1px solid #dbe9df;border-radius:9px;padding:10px 12px}
.ol-p-highlight strong{font-size:11px;color:#276b57}
.ol-p-highlight p{font-size:12px;line-height:1.65;color:#345348;margin:6px 0 0}
.ol-p-original-note{font-size:11px;color:#668071}
.ol-preview-dialog [hidden]{display:none!important}
.ol-preview-dialog [hidden]{display:none!important}
.ol-p-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:20px}
.ol-p-link{display:inline-block;background:#0c7769;color:#fff!important;text-decoration:none;border-radius:8px;padding:10px 13px;font-size:12px;font-weight:750}
.ol-p-link:hover{background:#086357}
.ol-p-secondary{border:1px solid #dde4f1;background:#fff;border-radius:8px;padding:9px 11px;font-size:12px;color:#536683;cursor:pointer}
@media(max-width:600px){.ol-p-head{padding:16px}.ol-p-content{padding:16px}.ol-p-head h2{font-size:17px}.ol-preview-trigger{padding:7px}}

.ol-quick-panel{margin-top:17px;padding:15px 16px 16px;border:1px solid #dce5fa;background:#f4f7ff;border-radius:11px}
.ol-quick-panel strong{font-size:13px;color:#25375f}
.ol-quick-panel p{margin:5px 0 12px;font-size:11px;color:#637593;line-height:1.55}
.ol-quick-actions{display:flex;flex-wrap:wrap;gap:8px}
.ol-quick-actions .ol-preview-trigger{background:#3458dc;color:white;border-color:#3458dc;white-space:normal;text-align:left}
.ol-quick-actions .ol-preview-trigger:hover{background:#274abb}
.ol-card-preview{margin-top:12px;display:inline-flex;max-width:100%;font-size:11px}
.ol-quick-panel .ol-empty{margin:2px 0;color:#7a88a2}
@media(max-width:600px){.ol-quick-actions{display:grid;grid-template-columns:1fr}.ol-quick-actions .ol-preview-trigger{justify-content:center;min-height:39px}.ol-card-preview{min-height:34px}}
`;
const style=document.createElement('style');style.textContent=css;document.head.append(style);
const dlg=document.createElement('dialog');dlg.className='ol-preview-dialog';dlg.setAttribute('aria-label','Article preview');
dlg.innerHTML=`<div class="ol-p-head"><div><div class="ol-p-label">Source article preview</div><h2 id="ol-p-title">Article title</h2><div class="ol-p-meta" id="ol-p-meta"></div></div><button type="button" class="ol-p-close" aria-label="Close article preview" title="Close">×</button></div><div class="ol-p-content"><div id="ol-p-result" hidden><div class="ol-p-kind" id="ol-p-kind"></div><p class="ol-p-synopsis" id="ol-p-synopsis"></p><div class="ol-p-highlights" id="ol-p-highlights" hidden></div><div class="ol-p-note" id="ol-p-note"></div></div><div class="ol-p-actions"><a id="ol-p-open" class="ol-p-link" target="_blank" rel="noopener noreferrer">Open original article ↗</a><button type="button" class="ol-p-secondary" id="ol-p-done">Close</button></div></div>`;
document.body.append(dlg);
const $=(id)=>dlg.querySelector('#'+id);
const close=()=>{if(dlg.open)dlg.close()};
dlg.querySelector('.ol-p-close').addEventListener('click',close);
$('ol-p-done').addEventListener('click',close);
dlg.addEventListener('click',e=>{if(e.target===dlg)close()});
let controller=null;let requestId=0;
dlg.addEventListener('close',()=>{controller?.abort();requestId++});

const previewCache=new Map();
function googleFeedLink(u){try{return new URL(u).hostname.toLowerCase()==='news.google.com'}catch{return false}}
function paintPreview(kind,text,note,highlights=[]){
  $('ol-p-kind').textContent=kind;
  $('ol-p-synopsis').textContent=text;
  $('ol-p-note').textContent=note;
  const holder=$('ol-p-highlights');
  holder.replaceChildren();
  for(const point of highlights.slice(0,2)){
    const card=document.createElement('div');card.className='ol-p-highlight';
    const label=document.createElement('strong');label.textContent=point.label;
    const excerpt=document.createElement('p');excerpt.textContent=point.text;
    card.append(label,excerpt);holder.append(card);
  }
  holder.hidden=!holder.childElementCount;
  $('ol-p-result').hidden=false;
}
async function openPreview(url,title,outlet,when){
  if(!/^https:\/\//i.test(url))return;
  controller?.abort();
  controller=new AbortController();
  const active=++requestId;
  const fromGoogle=googleFeedLink(url);
  $('ol-p-title').textContent=title||'Untitled article';
  $('ol-p-meta').textContent=[outlet,when].filter(Boolean).join(' · ');
  $('ol-p-open').href=url;
  $('ol-p-open').textContent=fromGoogle?'Continue through Google News ↗':'Open publisher article ↗';
  if(!dlg.open){try{dlg.showModal()}catch{dlg.setAttribute('open','')}}
  paintPreview(fromGoogle?'Finding the original publisher…':'Checking publisher description…',
    title||'Article title unavailable',
    fromGoogle?'This headline is available now. OpenLens is attempting to identify the original publisher article; the Google News link remains available.':'The headline is available now. An accessible public publisher synopsis may be added shortly.');
  const applyData=data=>{
    if(active!==requestId||!dlg.open)return;
    const publisherUrl=typeof data.originalUrl==='string'&&/^https:\/\//i.test(data.originalUrl)
      &&!googleFeedLink(data.originalUrl)?data.originalUrl:null;
    if(publisherUrl){
      $('ol-p-open').href=publisherUrl;
      $('ol-p-open').textContent='Open original publisher ↗';
    }
    const highlights=Array.isArray(data.highlights)?data.highlights.filter(x=>x&&typeof x.text==='string'&&typeof x.label==='string'):[];
    if(data.synopsis){
      paintPreview(highlights.length>1?'Publisher-backed article highlights':data.summarySource||'Publisher article description',
        data.synopsis,
        (data.notice||'Accessible publisher-provided information.')+' These are attributed descriptions or excerpts, not an independent full-article summary.',
        highlights.length>1?highlights:[]);
    }else if(publisherUrl){
      paintPreview('Original publisher located · article text unavailable',
        title||'Article headline unavailable',
        data.notice||'The original article link is available, but no reliable public synopsis could be retrieved.');
    }else{
      paintPreview('Headline only · publisher could not be resolved',
        title||'Article headline unavailable',
        data.notice||'The Google News link could not be resolved. Continue through Google News to read the article.');
    }
    if(data.publishedAt){
      const date=new Date(data.publishedAt);
      if(Number.isFinite(+date))$('ol-p-meta').textContent=[outlet,'Publisher date: '+date.toLocaleString()].filter(Boolean).join(' · ');
    }
  };
  if(previewCache.has(url)){applyData(previewCache.get(url));return}
  // Google decoding needs two small external requests, then optional publisher metadata.
  // The headline remains visible, and no loading spinner is shown.
  const timeout=setTimeout(()=>controller.abort(),fromGoogle?12500:4500);
  try{
    const response=await fetch('/api/article-preview?'+new URLSearchParams({url}),{
      signal:controller.signal,headers:{Accept:'application/json'}
    });
    if(!response.ok)throw new Error('Preview unavailable');
    const data=await response.json();
    if(active!==requestId)return;
    previewCache.set(url,data);
    if(previewCache.size>120)previewCache.delete(previewCache.keys().next().value);
    applyData(data);
  }catch{
    if(active===requestId&&dlg.open)paintPreview(
      fromGoogle?'Headline only · publisher lookup unavailable':'Headline only · publisher synopsis unavailable',
      title||'Article headline unavailable',
      fromGoogle?'Unable to resolve this Google News link right now. Open it through Google News to read the reporting.':'The publisher did not provide an accessible description quickly. Open the original article to read it.'
    );
  }finally{clearTimeout(timeout)}
}
function makeTrigger(article,label,variant){
  const b=document.createElement('button');
  b.type='button';b.className='ol-preview-trigger '+(variant||'');
  b.textContent=label;
  b.dataset.olUrl=String(article.url||'');
  b.dataset.olTitle=String(article.title||'Article headline');
  b.dataset.olOutlet=typeof sourceInfo==='function'?sourceInfo(article).name:String(article.source||'Publisher');
  b.dataset.olWhen=String(article.when||'');
  b.setAttribute('aria-label',label+': '+b.dataset.olTitle);
  return b;
}
function decorate(){
  if(typeof current==='function'&&typeof filteredArticles==='function'){
    const selected=current();
    const articles=selected?filteredArticles(selected).filter(a=>/^https:\/\//i.test(a.url||'')):[];
    const heading=document.querySelector('.detail-top');
    if(heading&&!heading.querySelector('.ol-quick-panel')){
      const section=document.createElement('section');
      section.className='ol-quick-panel';
      const strong=document.createElement('strong');strong.textContent='Article summaries & previews';
      const note=document.createElement('p');note.textContent='Open a source for its original publisher link and public article synopsis where available. Some publishers restrict access.';
      section.append(strong,note);
      const actions=document.createElement('div');actions.className='ol-quick-actions';
      if(articles.length){
        articles.slice(0,5).forEach(a=>actions.append(makeTrigger(a,'Preview · '+(typeof sourceInfo==='function'?sourceInfo(a).name:'Publisher'),'ol-quick-trigger')));
      }else{
        const empty=document.createElement('p');empty.className='ol-empty';empty.textContent='This is an illustrative example or has no accessible article link. Refresh news for live previews.';actions.append(empty);
      }
      section.append(actions);heading.append(section);
    }
    document.querySelectorAll('.story-card[data-story]').forEach(card=>{
      if(card.querySelector('.ol-card-preview'))return;
      const story=state.stories.find(s=>s.id===card.dataset.story);
      const first=story?filteredArticles(story).find(a=>/^https:\/\//i.test(a.url||'')):null;
      if(first)card.append(makeTrigger(first,'Article preview','ol-card-preview'));
    });
  }

  const methods=document.querySelector('.focus-panel');
  if(methods && !methods.querySelector('.ol-p-method')){const note=document.createElement('div');note.className='method-card ol-p-method';note.innerHTML='<h3>Article previews and summary limits</h3><p>The preview opens public article metadata or a short lead excerpt when accessible. A publisher-provided description is labeled as such. OpenLens does not generate or verify full-text AI summaries, and inaccessible, paywalled, or blocked pages are marked unavailable. Always read the linked publisher article before drawing conclusions about omissions or disputed claims.</p>';methods.append(note)}
  document.querySelectorAll('.coverage-row').forEach(row=>{
    if(row.querySelector('.ol-preview-trigger'))return;
    const a=row.querySelector('h4 a[href]');if(!a||!/^https:\/\//i.test(a.href))return;
    a.title='Preview available article synopsis (source link below opens publisher)';
    const button=document.createElement('button');button.className='ol-preview-trigger';button.type='button';button.textContent='Summary preview';
    button.setAttribute('aria-label','Preview summary of '+(a.textContent||'article'));
    const foot=row.querySelector('.coverage-footer');if(foot)foot.append(button);
  });
}
function eventPreview(e){
  const trigger=e.target.closest?.('.ol-preview-trigger,.coverage-row h4 a');if(!trigger)return;
  if((e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)&&trigger.matches('a'))return;
  const row=trigger.closest('.coverage-row');
  const a=row?.querySelector('h4 a[href]');
  const url=trigger.dataset.olUrl||a?.href;
  if(!url||!/^https:\/\//i.test(url))return;
  e.preventDefault();e.stopPropagation();
  const title=trigger.dataset.olTitle||a?.textContent?.trim()||'Article';
  const outlet=trigger.dataset.olOutlet||row?.querySelector('.outlet-name')?.textContent?.trim()||'Publisher';
  const published=trigger.dataset.olWhen||row?.querySelector('.coverage-footer span')?.textContent?.trim()||'';
  openPreview(url,title,outlet,published,'');
}
document.addEventListener('click',eventPreview,true);
const orig=typeof render==='function'?render:null;
if(orig){render=function(){orig();decorate()}}
decorate();
})();
