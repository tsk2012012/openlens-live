/* OpenLens: editorial-first Explore, with story-level analysis on demand.
 * Reuses existing feed, source ratings, previews, bookmarks and methodology.
 */
(function(){
'use strict';
if(typeof dashboard!=='function'||typeof render!=='function'||typeof filterStories!=='function')return;
const style=document.createElement('style');style.textContent="\n/* Editorial front page & full-width story reader */\n.ol-refresh .content{max-width:1530px}\n.ol-newsroom{max-width:1370px;margin:auto}\n.ol-newsroom-hero{background:#fff;border:1px solid #e1e9e2;border-radius:19px;padding:31px 36px 27px;margin:0 0 18px;display:flex;justify-content:space-between;align-items:center;gap:22px}\n.ol-newsroom-kicker{font-size:10px;letter-spacing:.16em;font-weight:800;color:#0b8970;text-transform:uppercase}\n.ol-newsroom-hero h1{font-family:Georgia,\"Times New Roman\",serif;font-size:clamp(29px,3.5vw,45px);font-weight:700;letter-spacing:-1.3px;line-height:1.12;color:#18313a;max-width:720px;margin:13px 0 11px}\n.ol-newsroom-hero p{font-size:13px;line-height:1.7;color:#6c8177;max-width:650px;margin:0}\n.ol-newsroom-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}\n.ol-newsroom-actions .btn{min-height:42px;white-space:nowrap;border-radius:10px}\n.ol-feed-status{font-size:11px;color:#788e80;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}\n.ol-feed-status::before{content:\"\";height:7px;width:7px;background:#16a07c;border-radius:100%}\n.ol-newsroom-toolbar{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:21px 3px 14px}\n.ol-newsroom-toolbar h2{font-family:Georgia,\"Times New Roman\",serif;color:#1b353e;font-size:25px;letter-spacing:-.6px;margin:0 0 5px}\n.ol-newsroom-toolbar p{color:#72857d;font-size:12px;margin:0;line-height:1.6}\n.ol-newsroom-count{font-size:11px;color:#829388;white-space:nowrap}\n.ol-newsroom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:stretch}\n.ol-feed-card{background:#fff;border:1px solid #dfe9e2;border-radius:16px;padding:19px 21px;display:flex;flex-direction:column;gap:10px;min-width:0;box-shadow:0 3px 15px rgba(17,46,43,.025);transition:box-shadow .15s,border-color .15s,transform .15s}\n.ol-feed-card:hover{border-color:#b8d6c5;box-shadow:0 8px 23px rgba(25,61,46,.065);transform:translateY(-1px)}\n.ol-feed-card.ol-feed-featured{grid-column:span 2;padding:26px 29px;background:linear-gradient(130deg,#fff 70%,#f0f8f3 100%)}\n.ol-feed-overline{display:flex;justify-content:space-between;align-items:center;gap:9px}\n.ol-feed-category{font-size:10px;color:#137663;letter-spacing:.09em;font-weight:800;text-transform:uppercase}\n.ol-feed-time{font-size:10px;color:#8a9a8d;white-space:nowrap}\n.ol-feed-title{appearance:none;border:0;background:none;color:#213940;text-align:left;font-weight:770;font-size:18px;line-height:1.35;letter-spacing:-.4px;padding:0;cursor:pointer}\n.ol-feed-title:hover{color:#0b806d}\n.ol-feed-featured .ol-feed-title{font-family:Georgia,\"Times New Roman\",serif;font-size:clamp(23px,2.2vw,32px);line-height:1.18;letter-spacing:-.7px;font-weight:700}\n.ol-feed-description{font-size:12px;line-height:1.65;color:#77887d;margin:0;flex:1}\n.ol-feed-source-list{font-size:11px;line-height:1.6;color:#637c70}\n.ol-feed-source-list strong{color:#344c43}\n.ol-feed-line{height:1px;background:#edf1ed;margin-top:auto}\n.ol-feed-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}\n.ol-feed-meta{color:#819186;font-size:11px}\n.ol-feed-cta{font-size:11px;font-weight:800;color:#087563;background:#eff8f1;border:1px solid #d2e9d9;border-radius:8px;padding:8px 11px;cursor:pointer;min-height:34px}\n.ol-feed-cta:hover{background:#dff1e5}\n.ol-feed-save{border:1px solid #e1ebe2;border-radius:8px;background:#fff;color:#5c7768;padding:8px 9px;font-size:11px;min-height:34px;cursor:pointer}\n.ol-feed-save.saved{border-color:#9ccbb3;color:#0b8066;background:#eff8f1}\n.ol-feed-actions{display:flex;align-items:center;gap:6px}\n.ol-feed-empty{grid-column:1/-1;text-align:center;padding:45px 20px;background:#fff;border:1px solid #e1e9e2;border-radius:15px}\n.ol-feed-empty h3{font-size:18px;color:#25453f}\n.ol-feed-empty p{font-size:12px;color:#70867a}\n.ol-sample-disclosure{margin-top:21px;border:1px solid #e3ebe3;background:#fff;border-radius:13px;padding:0 17px}\n.ol-sample-disclosure>summary{cursor:pointer;font-size:12px;font-weight:720;color:#607d70;list-style:none;padding:16px 0}\n.ol-sample-disclosure>summary::before{content:\"▸\";color:#18846e;margin-right:9px}\n.ol-sample-disclosure[open]>summary::before{content:\"▾\"}\n.ol-sample-disclosure .bias-overall{margin:0 0 17px;box-shadow:none}\n.ol-newsroom-disclaimer{font-size:11px;color:#84978c;line-height:1.75;margin:18px 3px 0}\n.ol-reader{max-width:1190px;margin:0 auto}\n.ol-reader-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 16px}\n.ol-reader-back{border:0;background:none;color:#0b806a;font-size:12px;font-weight:800;padding:7px 1px;cursor:pointer}\n.ol-reader-back:hover{text-decoration:underline}\n.ol-reader-nav-caption{font-size:11px;color:#879a8d}\n.ol-reader-hero{background:#fff;padding:31px 36px;border:1px solid #e0e9e2;border-radius:18px;margin-bottom:15px}\n.ol-reader-hero h1{font-family:Georgia,\"Times New Roman\",serif;font-size:clamp(29px,3.5vw,42px);letter-spacing:-1.2px;line-height:1.19;color:#1b343d;margin:12px 0 14px;max-width:970px}\n.ol-reader-lead{color:#6c8176;font-size:13px;line-height:1.75;max-width:830px;margin:0 0 20px}\n.ol-reader-metadata{display:flex;gap:10px 19px;flex-wrap:wrap;font-size:11px;color:#718a7d;margin-top:16px;padding-top:16px;border-top:1px solid #edf1ec}\n.ol-reader-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.ol-reader-actions .ol-feed-save{min-height:38px}\n.ol-reader-section-title{margin:22px 0 12px;display:flex;align-items:baseline;justify-content:space-between;gap:10px}\n.ol-reader-section-title h2{font-family:Georgia,\"Times New Roman\",serif;font-size:23px;color:#183842;letter-spacing:-.5px;margin:0}\n.ol-reader-section-title p{font-size:11px;color:#819488;margin:0}\n.ol-reader-snapshot{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(220px,.8fr);gap:13px}\n.ol-reader-headlines,.ol-reader-method{background:#fff;border:1px solid #e2eae2;border-radius:14px;padding:17px 19px}\n.ol-reader-headlines h3,.ol-reader-method h3{font-size:13px;color:#34594c;margin:0 0 8px}\n.ol-reader-headline{padding:11px 0;border-top:1px solid #edf1ed;display:grid;gap:5px}\n.ol-reader-headline:first-of-type{border-top:0}\n.ol-reader-headline small{font-size:10px;color:#7a9383}\n.ol-reader-headline a{font-size:12px;line-height:1.55;color:#1e4a41;font-weight:700;text-decoration:none}\n.ol-reader-headline a:hover{text-decoration:underline;color:#087764}\n.ol-reader-method p{font-size:11px;line-height:1.75;color:#73867d;margin:8px 0 0}\n.ol-reader-analyses{margin-top:17px}\n.ol-reader .compare-grid{display:block!important}\n.ol-reader .compare-grid>.detail{width:100%;max-width:none}\n.ol-reader .detail-top h2,.ol-reader .detail-top .lede{display:none!important}\n.ol-reader .detail-top{padding:17px 19px}\n.ol-reader .detail-top .context-row{margin-top:0}\n.ol-reader .detail .panel{box-shadow:none}\n.ol-reader .detail .ol-mobile-back{display:none!important}\n.ol-reader .ol-detail-tabs{border-radius:11px}\n.ol-reader .ol-analysis-note{margin:6px 3px 0}\n.ol-reader .ol-quick-panel{background:#f5faf5}\n.ol-reader .bias-panel[aria-label=\"Political coverage distribution\"]{border-color:#e0eae2}\n.ol-reader .bias-related{margin-top:15px}\n.ol-reader .coverage-row h4{line-height:1.65}\n@media(max-width:1100px){.ol-newsroom-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ol-feed-card.ol-feed-featured{grid-column:span 2}.ol-reader-snapshot{grid-template-columns:1fr}}\n@media(max-width:650px){\n.ol-newsroom-hero{flex-direction:column;align-items:stretch;padding:22px 21px}\n.ol-newsroom-hero h1{font-size:31px}\n.ol-newsroom-actions{justify-content:space-between}\n.ol-newsroom-grid{grid-template-columns:1fr;gap:10px}\n.ol-feed-card.ol-feed-featured{grid-column:span 1;padding:21px}\n.ol-feed-card{padding:17px}\n.ol-feed-title{font-size:18px}\n.ol-feed-featured .ol-feed-title{font-size:26px}\n.ol-newsroom-toolbar h2{font-size:22px}\n.ol-newsroom-toolbar{margin-top:16px}\n.ol-newsroom-count{display:none}\n.ol-reader-hero{padding:23px 20px}\n.ol-reader-hero h1{font-size:30px}\n.ol-reader-metadata{gap:8px}\n.ol-reader-nav-caption{display:none}\n.ol-reader-section-title{display:block}\n.ol-reader-section-title p{margin-top:6px}\n.ol-reader-headlines,.ol-reader-method{padding:15px}\n}\n@media(prefers-reduced-motion:reduce){.ol-feed-card{transition:none}.ol-feed-card:hover{transform:none}}\n";document.head.append(style);
let openStoryId=null;
const label=t=>String(t??'').trim();
const articleDate=s=>{
 const rows=filteredArticles(s).filter(a=>a.when&&Number.isFinite(Date.parse(a.when)));
 if(!rows.length)return 'Date not available';
 const latest=rows.reduce((a,b)=>Date.parse(a.when)>Date.parse(b.when)?a:b);
 return relative(latest.when);
};
const sources=s=>[...new Set(filteredArticles(s).map(a=>sourceInfo(a).name))];
const plural=(n,singular,other)=>n+' '+(n===1?singular:other);
function card(s,i){
 const articles=filteredArticles(s),outlets=sources(s),featured=i===0;
 const title=ESC(s.title),id=ESC(s.id),kind=ESC(s.topic||'News');
 const unique=outlets.slice(0,3).map(ESC).join(' · ');
 const overline=(s.demo?'DEMO · ':'')+kind;
 return '<article class="ol-feed-card'+(featured?' ol-feed-featured':'')+'">'+
 '<div class="ol-feed-overline"><span class="ol-feed-category">'+overline+'</span><span class="ol-feed-time">'+ESC(articleDate(s))+'</span></div>'+
 '<button type="button" class="ol-feed-title" data-ol-open-story="'+id+'" aria-label="Compare coverage: '+title+'">'+title+'</button>'+
 '<p class="ol-feed-description">'+(s.demo?'Illustrative headline group. Refresh to see live publisher links.':
 'Headlines tentatively grouped by wording. Open the comparison to inspect reporting and sources.')+'</p>'+
 '<div class="ol-feed-source-list"><strong>Publishers:</strong> '+(unique||'Not yet identified')+(outlets.length>3?' · +'+(outlets.length-3)+' more':'')+'</div>'+
 '<div class="ol-feed-line"></div><div class="ol-feed-footer">'+
 '<span class="ol-feed-meta">'+plural(outlets.length,'publisher','publishers')+' · '+plural(articles.length,'article','articles')+'</span>'+
 '<div class="ol-feed-actions"><button type="button" class="ol-feed-save'+(getSaved(s)?' saved':'')+'" data-action="save" data-id="'+id+'" aria-label="'+(getSaved(s)?'Remove saved story':'Save story')+'">'+(getSaved(s)?'Saved ✓':'Save')+'</button>'+
 '<button type="button" class="ol-feed-cta" data-ol-open-story="'+id+'">Compare reporting ↗</button></div></div></article>';
}
function browse(){
 const stories=filterStories(),count=sourcesCount(stories);
 return '<div class="ol-newsroom"><header class="ol-newsroom-hero"><div><span class="ol-newsroom-kicker">OPENLENS / NEWS INTELLIGENCE</span>'+
 '<h1 id="ol-newsroom-heading" tabindex="-1">The news, with perspective.</h1>'+
 '<p>Discover the headlines. Choose a story to compare publisher reporting, source context and the evidence behind coverage differences.</p></div>'+
 '<div class="ol-newsroom-actions"><span class="ol-feed-status">'+
 (state.mode==='live'?'Live headline sample':state.mode==='cached'?'Saved headline sample':'Illustrative demo')+'</span>'+
 '<button type="button" data-action="refresh" class="btn primary">'+(state.loading?'Refreshing…':'↻ Refresh news')+'</button></div></header>'+
 '<section aria-label="Explore news topics">'+filterSection()+'</section>'+
 '<div class="ol-newsroom-toolbar"><div><h2>Latest coverage</h2><p>Open a story for deeper comparison. Coverage matches have not been independently verified.</p></div>'+
 '<span class="ol-newsroom-count">'+plural(stories.length,'story','stories')+' · '+plural(count,'publisher','publishers')+'</span></div>'+
 '<section class="ol-newsroom-grid" aria-label="News stories">'+
 (stories.length?stories.map(card).join(''):
 '<div class="ol-feed-empty"><h3>No stories found</h3><p>Change a filter or refresh the available headlines.</p><button class="ol-feed-cta" data-action="clear">Clear filters</button></div>')+
 '</section><details class="ol-sample-disclosure" id="ol-sample-disclosure"><summary>Explore the political-source distribution in this sample</summary><div id="ol-sample-disclosure-body"></div></details>'+
 '<p class="ol-newsroom-disclaimer">OpenLens samples news headlines and publisher information; it does not certify article accuracy, identify proven omissions or represent the entire media landscape. '+(state.lastFetched?'Feed fetched '+ESC(timeFmt(state.lastFetched))+'.':'')+'</p></div>';
}
function report(s){
 const articles=filteredArticles(s),outlets=sources(s);
 const head=articles.filter(x=>safeURL(x.url)).slice(0,3).map(a=>
 '<div class="ol-reader-headline"><small>'+ESC(sourceInfo(a).name)+' · '+ESC(a.kind||'Reporting')+'</small>'+
 link(a.url,ESC(a.title))+'</div>').join('');
 const subtitle=s.demo?'This is an illustrative story. Refresh for live publisher reporting.':
 'An overview of available headlines grouped by similar wording. Explore the original reporting before drawing conclusions about factual agreement or omission.';
 return '<div class="ol-reader"><nav class="ol-reader-nav" aria-label="Story navigation">'+
 '<button type="button" class="ol-reader-back" data-ol-story-back>← Back to all stories</button>'+
 '<span class="ol-reader-nav-caption">Explore / '+ESC(s.topic||'News')+' / Story comparison</span></nav>'+
 '<header class="ol-reader-hero"><span class="ol-newsroom-kicker">'+ESC(s.topic||'News')+' · HEADLINE COMPARISON</span>'+
 '<h1 id="ol-reader-heading" tabindex="-1">'+ESC(s.title)+'</h1>'+
 '<p class="ol-reader-lead">'+subtitle+'</p>'+
 '<div class="ol-reader-actions"><button type="button" data-action="save" data-id="'+ESC(s.id)+'" class="ol-feed-save'+(getSaved(s)?' saved':'')+'">'+(getSaved(s)?'Saved ✓':'☆ Save this story')+'</button>'+
 '<button type="button" class="ol-feed-cta" data-ol-reader-jump>See publisher comparison ↓</button></div>'+
 '<div class="ol-reader-metadata"><span>'+plural(outlets.length,'named publisher','named publishers')+'</span><span>'+plural(articles.length,'available article','available articles')+'</span>'+
 '<span>Latest indexed / feed date: '+ESC(articleDate(s))+'</span><span>'+ESC(s.demo?'Demonstration data':'Tentative headline match')+'</span></div></header>'+
 '<div class="ol-reader-section-title"><h2>Reporting at a glance</h2><p>Original publisher headlines, not an AI synthesis</p></div>'+
 '<div class="ol-reader-snapshot"><section class="ol-reader-headlines"><h3>What sources are publishing</h3>'+
 (head||'<p>No original article links are available in this example.</p>')+'</section>'+
 '<aside class="ol-reader-method"><h3>What this comparison can tell you</h3>'+
 '<p>View available publisher articles, externally attributed political leanings, tentative headline overlap and a coverage timeline.</p>'+
 '<p>These counts reflect only this retrieved sample. Different headlines may describe different events; absent terms do not prove an article omitted a fact.</p></aside></div>'+
 '<div class="ol-reader-section-title ol-reader-analyses"><h2>Compare perspectives and evidence</h2><p>Detailed tools appear only when you open a story</p></div>'+
 '<div class="compare-grid ol-reader-compare-grid" id="ol-reader-analysis">'+comparisonDetail(s)+'</div>'+
 '<p class="ol-newsroom-disclaimer">Publisher-level political assessments are not verdicts on the truth or accuracy of individual articles. Read the original sources before interpreting differences.</p></div>';
}
const previousDashboard=dashboard;
dashboard=function(){
 const list=filterStories();
 const selected=openStoryId&&list.find(s=>s.id===openStoryId);
 if(openStoryId&&!selected)openStoryId=null;
 return selected?report(selected):browse();
};
function afterRender(){
 if(state.view!=='dashboard')return;
 const panel=document.querySelector('.bias-overall'),slot=document.getElementById('ol-sample-disclosure-body');
 const detail=document.getElementById('ol-sample-disclosure');
 if(panel&&slot)slot.append(panel);
 if(detail&&!panel)detail.hidden=true;
 const active=openStoryId&&filterStories().some(s=>s.id===openStoryId);
 const crumb=document.getElementById('breadcrumb');
 if(crumb)crumb.textContent=active?'Story comparison':'Explore';
}
const originalRender=render;
render=function(){originalRender();afterRender()};
function focusPage(selector){
 window.scrollTo({top:0,behavior:'auto'});
 document.querySelector(selector)?.focus({preventScroll:true});
}
function openStory(id){
 const story=filterStories().find(s=>s.id===id);
 if(!story)return;
 openStoryId=id;state.selected=id;state.expanded=false;
 render();focusPage('#ol-reader-heading');
}
window.OpenLensOpenStory=openStory;
function closeStory(){
 if(!openStoryId)return;
 openStoryId=null;state.expanded=false;
 render();focusPage('#ol-newsroom-heading');
}
document.addEventListener('click',e=>{
 const story=e.target.closest?.('[data-ol-open-story]');
 if(story){e.preventDefault();e.stopImmediatePropagation();openStory(story.dataset.olOpenStory);return}
 const back=e.target.closest?.('[data-ol-story-back]');
 if(back){e.preventDefault();e.stopImmediatePropagation();closeStory();return}
 const jump=e.target.closest?.('[data-ol-reader-jump]');
 if(jump){e.preventDefault();e.stopImmediatePropagation();document.getElementById('ol-reader-analysis')?.scrollIntoView({behavior:'smooth',block:'start'});return}
 const dashboardButton=e.target.closest?.('[data-view="dashboard"],[data-action="dashboard"]');
 if(dashboardButton)openStoryId=null;
 const restored=e.target.closest?.('[data-action^="restore:"]');
 if(restored)openStoryId=restored.dataset.action.slice('restore:'.length);
},true);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&openStoryId&&state.view==='dashboard'&&!document.querySelector('dialog[open]'))closeStory();
});
render();
})();
