/* Evidence-first review workspace. Private local research, not a certified bias-rating service. */
(function(){
'use strict';
const core=window.OpenLensEditorialCore;
if(!core||typeof render!=='function'||typeof state==='undefined')return;
const storageKey='openlens.editorial.review.v1',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>core.key(s);
const options=(items,selected)=>items.map(x=>'<option value="'+esc(x)+'"'+(x===selected?' selected':'')+'>'+esc(x)+'</option>').join('');
let evidence=[],proposals=[],selected='',frame='Netherlands',reviewerHint='',storageAvailable=true;
try{
 const raw=localStorage.getItem(storageKey);
 if(raw){
  const saved=JSON.parse(raw),parsed=core.parseImport(saved,[]);
  if(parsed.ok){
   evidence=parsed.additions;
   proposals=Array.isArray(saved.proposals)?saved.proposals.filter(p=>p&&typeof p==='object'&&p.status==='Private reviewer hypothesis; not an independently published rating').slice(0,200):[];
   reviewerHint=String(saved.reviewerHint||'').slice(0,80);
  }
 }
}catch{storageAvailable=false}
function persist(){
 try{localStorage.setItem(storageKey,JSON.stringify({version:core.VERSION,evidence,proposals,reviewerHint,updatedAt:new Date().toISOString()}));storageAvailable=true;return true}
 catch{storageAvailable=false;return false}
}
function message(text,isError){
 const box=document.getElementById('ol-review-feedback');if(box){box.textContent=text;box.className=isError?'ol-review-error':'ol-review-existing'}
 if(typeof toast==='function')toast(text);
}
function sourceCandidates(){
 const sources=new Map();
 for(const a of state.allArticles||[]){
  const name=typeof sourceInfo==='function'?sourceInfo(a).name:(a.source||'Unknown');
  const assessment=window.OpenLensPublisherRatingLookup?.(name);
  const audit=window.OpenLensSourceAudit?.lookup(name);
  if(assessment&&assessment.rating!=='Unrated')continue;
  if(audit&&!audit.politicallyAssessable)continue;
  const id=norm(name);if(!id)continue;
  const entry=sources.get(id)||{name,count:0};
  entry.count++;sources.set(id,entry);
 }
 for(const a of evidence){
  const id=norm(a.publisher);
  if(!sources.has(id))sources.set(id,{name:a.publisher,count:0});
 }
 return [...sources.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
}
function selectedRows(){
 return evidence.filter(e=>norm(e.publisher)===norm(selected)&&e.frame===frame).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt));
}
function button(text,extra='',attrs=''){return '<button type="button" class="ol-review-btn '+extra+'" '+attrs+'>'+text+'</button>'}
function field(label,name,type,value,extra=''){
 return '<label class="ol-review-field">'+esc(label)+'<input name="'+name+'" type="'+type+'" value="'+esc(value||'')+'" '+extra+'></label>';
}
function queueMarkup(){
 const candidates=sourceCandidates();
 return '<section class="ol-review-box"><h2>Unrated review queue</h2><p class="ol-review-muted">Publishers in your current live feed without an independent political rating, plus any you already reviewed.</p>'+
 '<input id="ol-review-search" class="ol-review-search" type="search" placeholder="Find an outlet..." aria-label="Search publishers">'+
 '<div class="ol-review-queue">'+candidates.slice(0,140).map(a=>
  '<button type="button" class="ol-review-queue-item '+(norm(a.name)===norm(selected)?'active':'')+'" data-ol-review-source="'+esc(a.name)+'" data-ol-queue-name="'+esc(norm(a.name))+'"><span>'+esc(a.name)+'</span><small>'+a.count+' feed item'+(a.count===1?'':'s')+'</small></button>').join('')+
 '</div><div class="ol-review-section"><h3>Review another publisher</h3><label class="ol-review-field">Exact publisher name<input id="ol-review-custom" maxlength="160" placeholder="e.g. NOS" value=""></label>'+
 button('Open review','', 'data-ol-review-custom')+'</div></section>';
}
function formMarkup(){
 const p=core.progress(evidence,selected,frame),audit=window.OpenLensSourceAudit?.lookup(selected);
 const rating=window.OpenLensPublisherRatingLookup?.(selected);
 const metrics=[['Articles',p.articles,15],['Topics',p.topics,3],['Reviewers*',p.reviewers,3],['Date span',p.spanDays,21]];
 const summary=metrics.map(([label,n,target])=>'<div><strong>'+n+' / '+target+'</strong><span>'+label+'</span></div>').join('');
 const notes=p.entries?'': '<p class="ol-review-muted">No observations recorded for this publisher and reference frame yet.</p>';
 const items=selectedRows().slice(0,100).map(row=>
 '<article class="ol-review-entry"><div class="ol-review-entry-head"><div><h4>'+esc(row.articleTitle)+'</h4><small>'+esc(row.publishedAt)+' · '+esc(row.topic)+' · '+esc(row.kind)+' · Reviewer: '+esc(row.reviewer)+'</small></div>'+
 button('Delete','','data-ol-review-delete="'+esc(row.id)+'"')+'</div><p><strong>'+esc(row.basis)+':</strong> '+esc(row.observation)+'</p>'+
 '<div class="ol-review-observations"><span>'+esc(row.lean)+'</span><span>Self-reported</span></div><a class="ol-review-link" target="_blank" rel="noopener noreferrer" href="'+esc(row.articleUrl)+'">Open original article ↗</a></article>').join('');
 const existing=proposals.filter(x=>norm(x.publisher)===norm(selected)&&x.frame===frame).slice(-1)[0];
 const proposed=existing?'<div class="ol-review-existing"><strong>Saved private working hypothesis:</strong> '+esc(existing.rating)+'<p>'+esc(existing.rationale)+'</p><small>Not independently verified and not used in the public bias chart.</small></div>':'';
 const proposalForm=p.readyForHumanReview&&frame!=='International / other'?
 '<form id="ol-review-proposal"><div class="ol-review-form-grid">'+
 '<label class="ol-review-field">Provisional interpretation<select name="rating" required>'+options(['Left','Lean Left','Center','Lean Right','Right','Mixed / not classifiable'],'Mixed / not classifiable')+'</select></label>'+
 '<label class="ol-review-field ol-review-wide">Rationale and counterevidence<textarea name="rationale" minlength="120" maxlength="2500" required placeholder="Explain repeated article-level observations, plausible alternative interpretations and sampling limitations."></textarea></label></div>'+
 '<button class="ol-review-btn primary" type="submit">Save private hypothesis</button></form>':
 '<p class="ol-review-muted">A publisher-wide Left–Right interpretation is locked until the evidence threshold is met in a single national political reference frame. This is a minimum for human consideration, not scientific certification.</p>';
 return '<section class="ol-review-box"><h2>'+esc(selected)+'</h2><p class="ol-review-muted">'+esc(audit?.type||'Source category pending')+
 ' · Independent rating: <strong>'+esc(rating?.rating&&rating.rating!=='Unrated'?rating.rating:'Not assessed')+'</strong>. Local observations never replace external ratings.</p>'+
 '<label class="ol-review-field">Political reference frame<select id="ol-review-frame">'+options(core.FRAMES,frame)+'</select></label>'+
 '<div class="ol-review-progress">'+summary+'</div><p class="ol-review-status '+(p.readyForHumanReview?'ready':'')+'">'+
 (p.readyForHumanReview?'Evidence threshold reached — human review eligible, not independently certified':'Gather evidence across multiple news cycles and perspectives')+'</p>'+
 '<div class="ol-review-observations">'+core.LEANS.map(lean=>'<span>'+esc(lean)+': '+(p.observations[lean]||0)+'</span>').join('')+'</div>'+
 '<p class="ol-review-muted">The counts above are individual reviewer observations, not a publisher rating. Reviewer identities are self-reported and not independently authenticated.</p>'+
 '<div class="ol-review-section"><h3>Log a reviewed article</h3><p class="ol-review-muted">Read the publisher’s original article first. Google News links, headlines and previews are not sufficient.</p>'+
 '<form id="ol-review-evidence"><div class="ol-review-form-grid">'+
 field('Original publisher article URL','articleUrl','url','','required maxlength="2048" placeholder="https://publisher.example/article" class="ol-review-wide"')+
 field('Exact article title','articleTitle','text','','required minlength="8" maxlength="300"')+
 field('Publication date','publishedAt','date','','required')+
 field('Reviewer name / initials','reviewer','text',reviewerHint,'required minlength="2" maxlength="80"')+
 '<label class="ol-review-field">Topic<select name="topic" required>'+options(core.TOPICS,'Politics')+'</select></label>'+
 '<label class="ol-review-field">Article format<select name="kind" required>'+options(core.KINDS,'Reporting')+'</select></label>'+
 '<label class="ol-review-field">What was observed?<select name="basis" required>'+options(core.BASIS,'Framing / emphasis')+'</select></label>'+
 '<label class="ol-review-field">Framing observation<select name="lean" required>'+options(core.LEANS,'Insufficient evidence')+'</select></label>'+
 '<label class="ol-review-field ol-review-wide">Specific evidence and context<textarea name="observation" minlength="40" maxlength="1800" required placeholder="Describe verifiable article-level language, framing, source selection and any alternative explanation. Do not paste the entire article."></textarea></label>'+
 '</div><label class="ol-review-check"><input type="checkbox" name="fullTextRead" required>I read the original full article, not only a headline or AI-generated preview.</label>'+
 '<button type="submit" class="ol-review-btn primary">Save article evidence</button></form><div id="ol-review-feedback" aria-live="polite"></div></div>'+
 '<div class="ol-review-section"><h3>Review history ('+p.entries+' entries)</h3>'+notes+'<div class="ol-review-evidence">'+items+'</div></div>'+
 '<div class="ol-review-section"><h3>Private publisher interpretation</h3>'+proposed+proposalForm+'</div></section>';
}
function renderReviews(){
 const candidates=sourceCandidates();
 if(!selected)selected=candidates[0]?.name||'NOS';
 const seen=new Set(evidence.map(e=>norm(e.publisher)));
 const total=seen.size,eligible=[...seen].filter(k=>{
  const e=evidence.find(x=>norm(x.publisher)===k);
  return core.FRAMES.some(f=>core.progress(evidence,e.publisher,f).readyForHumanReview);
 }).length;
 const content=document.getElementById('content');
 if(!content)return;
 content.innerHTML='<section class="ol-review-title"><div><p class="eyebrow">EVIDENCE-BASED EDITORIAL RESEARCH</p><h1>Editorial review lab</h1>'+
 '<p>Build a transparent evidence trail before suggesting an outlet-wide editorial leaning. Local human notes are not verified ratings.</p></div>'+
 '<div class="ol-review-actions">'+button('Export research','','data-ol-review-export')+
 '<label class="ol-review-btn" for="ol-review-import">Import research</label><input id="ol-review-import" type="file" accept="application/json,.json" hidden></div></section>'+
 '<div class="ol-review-metrics"><div class="ol-review-metric"><strong>'+total+'</strong><span>Publishers examined</span></div><div class="ol-review-metric"><strong>'+evidence.length+'</strong><span>Article observations</span></div>'+
 '<div class="ol-review-metric"><strong>'+eligible+'</strong><span>Eligible for human interpretation</span></div></div>'+
 '<div class="ol-review-info"><strong>Important:</strong> A logged observation is subjective. The displayed progress is not a reliability grade or a political-bias rating. '+
 (storageAvailable?'Records are stored on this device, not shared or uploaded.':'Browser storage is unavailable; export any observations you need to keep.')+'</div>'+
 '<div class="ol-review-grid">'+queueMarkup()+formMarkup()+'</div>'+
 '<div class="ol-review-box" style="margin-top:15px"><details class="ol-review-method"><summary>Review protocol, safeguards and limitations</summary>'+
 '<p>Use direct original articles, not extracted summaries. Sample across different issues and weeks. Independently compare both news and opinion, record exact evidence, alternative explanations and date. Reviewers should evaluate framing, sourcing and omissions separately from factual accuracy.</p>'+
 '<p>Minimum before proposing a local hypothesis: 15 distinct articles, three topics, three self-reported reviewer aliases and coverage over 21 days. These are a gate, not a proof of independence or statistical representativeness. Real external ratings need trained and politically varied independent reviewers, documented sampling and dispute resolution.</p>'+
 '<p>National Left–Right scales differ, so US and Dutch work must not be averaged together. International reporting may not fit a single Left–Right axis. Neither local evidence nor a provisional conclusion updates the verified publisher spectrum chart.</p>'+
 '<p><a href="https://adfontesmedia.com/methodology/" target="_blank" rel="noopener noreferrer">Ad Fontes methodology</a> · <a href="https://www.allsides.com/about/media-bias-rating-methods" target="_blank" rel="noopener noreferrer">AllSides methodology</a></p>'+
 '</details></div>';
 const crumb=document.getElementById('breadcrumb');if(crumb)crumb.textContent='Editorial reviews';
}
function enhanceDashboard(){
 const check=window.OpenLensPublisherRatingLookup;
 document.querySelectorAll('.bias-audit-entry').forEach(entry=>{
  if(entry.querySelector('[data-ol-review-source]'))return;
  const name=entry.querySelector('strong')?.textContent?.trim();
  if(!name||check?.(name)?.rating!=='Unrated')return;
  const meta=window.OpenLensSourceAudit?.lookup(name);
  if(meta&&!meta.politicallyAssessable)return;
  const button=document.createElement('button');button.type='button';button.className='ol-audit-review-btn';
  button.textContent='Review evidence';button.dataset.olReviewSource=name;
  entry.append(button);
 });
 document.querySelectorAll('.coverage-row').forEach(row=>{
  if(row.querySelector('.ol-review-coverage-button'))return;
  const name=row.querySelector('.outlet-name')?.textContent?.trim();
  if(!name||check?.(name)?.rating!=='Unrated')return;
  if(window.OpenLensSourceAudit?.lookup(name)?.politicallyAssessable===false)return;
  const anchor=row.querySelector('.coverage-footer');if(!anchor)return;
  const button=document.createElement('button');button.type='button';button.className='ol-review-coverage-button';
  button.textContent='Log evidence';button.dataset.olReviewSource=name;anchor.append(button);
 });
}
function addNav(){
 const nav=document.querySelector('.sidebar nav'),claims=nav?.querySelector('[data-view="claims"]');
 if(!nav||!claims||nav.querySelector('[data-view="reviews"]'))return;
 const button=document.createElement('button');button.className='nav-btn';button.type='button';
 button.dataset.view='reviews';button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 4h14v16H5zM8 9h8M8 13h8M8 17h5"/></svg> Editorial reviews';
 claims.after(button);
}
const style=document.createElement('style');style.textContent="\n.ol-review-title{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin:0 0 18px}\n.ol-review-title h1{font-size:28px;color:#20443a;letter-spacing:-.7px;margin:4px 0 8px}\n.ol-review-title p{margin:0;color:#73867a;font-size:13px;line-height:1.55;max-width:710px}\n.ol-review-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}\n.ol-review-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 12px;min-height:37px;background:#fffefa;border:1px solid #d4e3d8;color:#2b6151;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer}\n.ol-review-btn:hover{background:#e6f3e9}\n.ol-review-btn.primary{background:#0c7769;border-color:#0c7769;color:white}\n.ol-review-btn:disabled{opacity:.5;cursor:not-allowed}\n.ol-review-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:15px 0}\n.ol-review-metric{padding:13px;background:#fffefa;border:1px solid #dfe8df;border-radius:12px}\n.ol-review-metric strong{font-size:24px;display:block;color:#206653;line-height:1.2}\n.ol-review-metric span{font-size:11px;color:#78887d}\n.ol-review-info{font-size:12px;color:#577265;line-height:1.65;background:#f2f7f1;border:1px solid #d8e9d8;padding:12px 14px;border-radius:11px;margin-bottom:15px}\n.ol-review-grid{display:grid;grid-template-columns:minmax(225px,.7fr) minmax(0,1.5fr);gap:15px;align-items:start}\n.ol-review-box{background:#fffefa;border:1px solid #dde7df;border-radius:15px;padding:17px;box-shadow:0 5px 18px #153b2609}\n.ol-review-box h2{font-size:17px;color:#254b3d;letter-spacing:-.3px;margin:0 0 9px}\n.ol-review-box h3{font-size:14px;color:#2e5648;margin:14px 0 10px}\n.ol-review-muted{font-size:11px;color:#75877b;line-height:1.5}\n.ol-review-field{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#446657;min-width:0}\n.ol-review-field input,.ol-review-field select,.ol-review-field textarea,.ol-review-search{padding:10px 11px;border:1px solid #d4e4d8;border-radius:9px;background:white;color:#254b3d;width:100%;min-width:0;font-size:13px}\n.ol-review-field textarea{min-height:104px;resize:vertical;line-height:1.5}\n.ol-review-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:13px 0}\n.ol-review-wide{grid-column:1/-1}\n.ol-review-queue{max-height:450px;overflow:auto;display:grid;gap:6px;margin-top:12px}\n.ol-review-queue-item{border:1px solid #e1ebe2;background:#fafcf8;padding:10px;border-radius:9px;cursor:pointer;text-align:left;display:flex;justify-content:space-between;gap:8px;align-items:center;color:#315749;font-size:12px;min-height:42px}\n.ol-review-queue-item:hover,.ol-review-queue-item.active{border-color:#8ac1aa;background:#e8f4ec}\n.ol-review-queue-item small{color:#7a8d7d;font-size:10px;white-space:nowrap}\n.ol-review-progress{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:12px 0}\n.ol-review-progress div{padding:10px;border-radius:9px;border:1px solid #e2eae1;background:#f8faf5}\n.ol-review-progress strong{font-size:16px;color:#235b49;display:block}\n.ol-review-progress span{font-size:10px;color:#77887c}\n.ol-review-status{font-size:11px;font-weight:730;color:#567767;margin:10px 0}\n.ol-review-status.ready{color:#096754}\n.ol-review-section{margin:19px 0 8px;border-top:1px solid #e6ece5;padding-top:15px}\n.ol-review-evidence{display:grid;gap:8px;margin-top:12px}\n.ol-review-entry{border:1px solid #e6ece5;border-radius:10px;padding:11px 12px}\n.ol-review-entry-head{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}\n.ol-review-entry h4{font-size:12px;margin:0 0 4px;line-height:1.5;color:#2b5142}\n.ol-review-entry p{font-size:11px;color:#647a6e;line-height:1.55;margin:6px 0}\n.ol-review-entry small{color:#809084;font-size:10px}\n.ol-review-observations{display:flex;gap:5px;flex-wrap:wrap;margin:10px 0}\n.ol-review-observations span{font-size:11px;padding:7px 8px;border:1px solid #e1e9e1;background:#f5f9f5;border-radius:7px;color:#4b665a}\n.ol-review-check{display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#435f52;line-height:1.55;margin:12px 0}\n.ol-review-check input{margin-top:3px;flex:none}\n.ol-review-divider{border:0;border-top:1px solid #e2e9e1;margin:18px 0}\n.ol-review-existing{font-size:11px;color:#697e70;padding:9px 12px;background:#f3f7f1;border-radius:9px}\n.ol-review-error{font-size:12px;color:#913b42;margin:8px 0;font-weight:650}\n.ol-review-add{margin-top:7px}\n.ol-review-method summary{font-weight:720;font-size:12px;color:#246451;cursor:pointer}\n.ol-review-method p,.ol-review-method li{color:#65796b;font-size:11px;line-height:1.65}\n.ol-review-link{font-size:11px;overflow-wrap:anywhere}\n.bias-audit-entry .ol-audit-review-btn{border:1px solid #b4d9c5;border-radius:7px;background:#eaf6ee;color:#166755;padding:5px 8px;font-size:10px;font-weight:700;cursor:pointer}\n.ol-review-coverage-button{border:1px solid #cce5d5;background:#ecf8ef;border-radius:7px;color:#176e56;font-size:10px;padding:5px 9px;margin-left:7px;cursor:pointer}\n@media(max-width:900px){.ol-review-grid{grid-template-columns:1fr}.ol-review-queue{max-height:190px}.ol-review-queue-item{min-height:42px}}\n@media(max-width:600px){.ol-review-title h1{font-size:24px}.ol-review-metrics{gap:6px}.ol-review-metric{padding:10px}.ol-review-metric strong{font-size:20px}.ol-review-form-grid{grid-template-columns:1fr}.ol-review-box{padding:12px}.ol-review-progress{grid-template-columns:repeat(2,minmax(0,1fr))}.ol-review-actions{width:100%}.ol-review-actions .ol-review-btn{flex:1}.bias-audit-entry .ol-audit-review-btn{grid-column:1/-1;width:max-content}}\n";document.head.append(style);
addNav();
const baseRender=render;
render=function(){
 baseRender();
 addNav();
 if(state.view==='reviews')renderReviews();
 else if(state.view==='dashboard')enhanceDashboard();
};
document.addEventListener('click',e=>{
 const target=e.target.closest?.('[data-ol-review-source]');
 if(target){selected=target.dataset.olReviewSource||selected;state.view='reviews';render();document.getElementById('content')?.scrollIntoView({block:'start'});return}
 const manual=e.target.closest?.('[data-ol-review-custom]');
 if(manual){const name=document.getElementById('ol-review-custom')?.value.trim();if(!name)return;selected=name.slice(0,160);render();return}
 const del=e.target.closest?.('[data-ol-review-delete]');
 if(del){if(!window.confirm('Delete this locally saved observation?'))return;evidence=evidence.filter(x=>x.id!==del.dataset.olReviewDelete);persist();render();return}
 if(e.target.closest?.('[data-ol-review-export]')){
  const data={version:core.VERSION,exportedAt:new Date().toISOString(),evidence,proposals,note:'Self-reported observations, not independent outlet ratings'};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='openlens-editorial-evidence.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
});
document.addEventListener('change',async e=>{
 if(e.target.id==='ol-review-frame'){frame=e.target.value;render();return}
 if(e.target.id==='ol-review-import'){
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>2*1024*1024){message('Import exceeds 2 MB.',true);return}
  try{const value=JSON.parse(await file.text()),parsed=core.parseImport(value,evidence);
   if(!parsed.ok){message(parsed.errors.join(' '),true);return}
   evidence.push(...parsed.additions);persist();render();
   message('Imported '+parsed.additions.length+' observations; skipped '+parsed.skipped+' duplicates and '+parsed.rejected.length+' invalid records.',false);
  }catch{message('Could not parse the review JSON export.',true)}
 }
});
document.addEventListener('input',e=>{
 if(e.target.id==='ol-review-search'){
  const query=norm(e.target.value);
  document.querySelectorAll('[data-ol-queue-name]').forEach(el=>el.hidden=!el.dataset.olQueueName.includes(query));
 }
});
document.addEventListener('submit',e=>{
 if(e.target.id==='ol-review-evidence'){
  e.preventDefault();const data=new FormData(e.target);
  const input=Object.fromEntries(data.entries());input.publisher=selected;input.frame=frame;input.fullTextRead=data.has('fullTextRead');
  const result=core.appendEvidence(evidence,input);
  if(!result.ok){message(result.errors.join(' '),true);return}
  evidence.push(result.value);reviewerHint=result.value.reviewer;persist();render();
  message('Article-level observation saved locally. It does not change the independent publisher rating.',false);
 }
 if(e.target.id==='ol-review-proposal'){
  e.preventDefault();const input=Object.fromEntries(new FormData(e.target).entries());input.publisher=selected;input.frame=frame;
  const result=core.proposal(evidence,input);
  if(!result.ok){message(result.errors.join(' '),true);return}
  proposals.push(result.value);persist();render();
  message('Private working hypothesis saved. It is not a verified bias rating.',false);
 }
});
if(state.view==='dashboard')enhanceDashboard();
})();
