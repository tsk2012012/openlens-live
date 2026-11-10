/* OpenLens article previews: linked publisher synopsis, never an invented full-text summary. */
(()=>{
'use strict';
const css=`
.ol-preview-trigger{display:inline-flex;align-items:center;gap:5px;background:#edf2ff;border:1px solid #dce5ff;color:#3154bd;border-radius:7px;padding:6px 9px;font-size:11px;font-weight:700;line-height:1.2;font-family:inherit;cursor:pointer}
.ol-preview-trigger:hover{background:#dfe9ff}
.coverage-row h4 a{cursor:pointer;text-decoration-color:#b3c2ec;text-underline-offset:3px}
.ol-preview-dialog{box-sizing:border-box;width:min(610px,calc(100vw - 26px));max-height:min(85vh,850px);padding:0;border:1px solid #dfe5f0;border-radius:17px;box-shadow:0 20px 75px rgba(20,37,72,.22);color:#17233e;background:white;overflow:auto}
.ol-preview-dialog::backdrop{background:rgba(19,32,58,.58);backdrop-filter:blur(2px)}
.ol-p-head{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #e8ecf4;padding:20px 22px 16px;gap:14px}
.ol-p-label{font-size:10px;color:#4663a4;letter-spacing:.1em;font-weight:800;text-transform:uppercase}
.ol-p-head h2{font-size:19px;line-height:1.37;font-weight:820;margin:9px 0 9px}
.ol-p-meta{font-size:11px;color:#8793a6;line-height:1.55}
.ol-p-close{width:29px;height:29px;flex:none;border:1px solid #e1e6f1;border-radius:8px;background:#fff;color:#43506a;cursor:pointer;font-size:18px}
.ol-p-content{padding:18px 22px}
.ol-p-kind{font-size:11px;font-weight:800;color:#375ed1;margin-bottom:9px}
.ol-p-synopsis{font-size:14px;line-height:1.75;color:#26354f;white-space:pre-wrap;margin:0 0 12px}
.ol-p-note{font-size:11px;line-height:1.6;color:#76869e;border-radius:9px;background:#f5f7fb;padding:11px;margin-top:14px}
.ol-p-loading{display:flex;align-items:center;gap:8px;color:#6e7e99;font-size:13px;padding:12px 0}
.ol-p-dot{width:10px;height:10px;border:2px solid #a8b7e5;border-top-color:#3556d9;border-radius:50%;animation:olSpin .7s linear infinite}
@keyframes olSpin{to{transform:rotate(360deg)}}
.ol-p-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:20px}
.ol-p-link{display:inline-block;background:#3458dc;color:#fff!important;text-decoration:none;border-radius:8px;padding:10px 13px;font-size:12px;font-weight:750}
.ol-p-link:hover{background:#2647bf}
.ol-p-secondary{border:1px solid #dde4f1;background:#fff;border-radius:8px;padding:9px 11px;font-size:12px;color:#536683;cursor:pointer}
@media(max-width:600px){.ol-p-head{padding:16px}.ol-p-content{padding:16px}.ol-p-head h2{font-size:17px}.ol-preview-trigger{padding:7px}}
`;
const style=document.createElement('style');style.textContent=css;document.head.append(style);
const dlg=document.createElement('dialog');dlg.className='ol-preview-dialog';dlg.setAttribute('aria-label','Article preview');
dlg.innerHTML=`<div class="ol-p-head"><div><div class="ol-p-label">Source article preview</div><h2 id="ol-p-title">Article title</h2><div class="ol-p-meta" id="ol-p-meta"></div></div><button type="button" class="ol-p-close" aria-label="Close article preview" title="Close">×</button></div><div class="ol-p-content"><div id="ol-p-status" class="ol-p-loading" role="status"><span class="ol-p-dot"></span>Checking publisher information…</div><div id="ol-p-result" hidden><div class="ol-p-kind" id="ol-p-kind"></div><p class="ol-p-synopsis" id="ol-p-synopsis"></p><div class="ol-p-note" id="ol-p-note"></div></div><div class="ol-p-actions"><a id="ol-p-open" class="ol-p-link" target="_blank" rel="noopener noreferrer">Open original article ↗</a><button type="button" class="ol-p-secondary" id="ol-p-done">Close</button></div></div>`;
document.body.append(dlg);
const $=(id)=>dlg.querySelector('#'+id);
const close=()=>{if(dlg.open)dlg.close()};
dlg.querySelector('.ol-p-close').addEventListener('click',close);
$('ol-p-done').addEventListener('click',close);
dlg.addEventListener('click',e=>{if(e.target===dlg)close()});
let controller=null;let requestId=0;
dlg.addEventListener('close',()=>{controller?.abort();requestId++});
async function openPreview(url,title,outlet,when,feedDateType){
  if(!/^https:\/\//i.test(url))return;
  controller?.abort();controller=new AbortController();const active=++requestId;
  $('ol-p-title').textContent=title||'Untitled article';
  $('ol-p-meta').textContent=[outlet,when].filter(Boolean).join(' · ');
  $('ol-p-open').href=url;
  $('ol-p-result').hidden=true;
  $('ol-p-status').hidden=false;
  $('ol-p-status').innerHTML='<span class="ol-p-dot"></span>Checking publisher information…';
  if(!dlg.open){try{dlg.showModal()}catch{dlg.setAttribute('open','')}}
  const timeout=setTimeout(()=>controller?.abort(),12000);
  try{
    const res=await fetch('/api/article-preview?'+new URLSearchParams({url}),{signal:controller.signal,headers:{Accept:'application/json'}});
    const data=await res.json();
    if(active!==requestId)return;
    if(!res.ok)throw new Error(data.reason||data.error||'Publisher preview is unavailable.');
    $('ol-p-kind').textContent=data.summarySource||'No article synopsis available';
    $('ol-p-synopsis').textContent=data.synopsis||'This publisher has not provided an accessible description or readable article lead. Select “Open original article” to read the full reporting.';
    $('ol-p-note').textContent=(data.notice||'')+' OpenLens does not verify the article or claim to have summarized its complete contents.';
    if(data.publishedAt){const t=new Date(data.publishedAt);if(Number.isFinite(+t))$('ol-p-meta').textContent=outlet+' · Page publication date: '+t.toLocaleString()}
    $('ol-p-result').hidden=false;
    $('ol-p-status').hidden=true;
  }catch(error){
    if(active!==requestId||!dlg.open)return;
    $('ol-p-kind').textContent='Preview unavailable';
    $('ol-p-synopsis').textContent='OpenLens could not retrieve a reliable publisher synopsis for this link. You can still open the original article.';
    $('ol-p-note').textContent='This can happen with paywalls, publisher blocks, Google News redirects, or unavailable pages. No content summary has been invented.';
    $('ol-p-result').hidden=false;
    $('ol-p-status').hidden=true;
  }finally{clearTimeout(timeout)}
}
function decorate(){
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
  const row=trigger.closest('.coverage-row');const a=row?.querySelector('h4 a[href]');if(!a)return;
  e.preventDefault();e.stopPropagation();
  const outlet=row.querySelector('.outlet-name')?.textContent?.trim()||'Publisher';
  const published=row.querySelector('.coverage-footer span')?.textContent?.trim()||'';
  openPreview(a.href,a.textContent?.trim(),outlet,published,'');
}
document.addEventListener('click',eventPreview,true);
const orig=typeof render==='function'?render:null;
if(orig){render=function(){orig();decorate()}}
decorate();
})();
