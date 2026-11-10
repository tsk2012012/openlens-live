/* OpenLens professional shell: navigation and clarity, no source data changes. */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const style=document.createElement('style');style.textContent="\n:root{--ol-deep:#18323d;--ol-teal:#0a7c6c;--ol-bg:#f4f7f5;--ol-line:#e0e8e3}\nbody.ol-refresh{background:var(--ol-bg);color:var(--ol-deep);font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif}\n.ol-refresh .app{grid-template-columns:240px minmax(0,1fr)}\n.ol-refresh .sidebar{background:#fff;border-right:1px solid var(--ol-line);padding:25px 15px}\n.ol-refresh .brand{color:var(--ol-deep);font-size:20px;letter-spacing:-.8px;gap:9px;padding:0 10px 26px}\n.ol-refresh .ol-brand-logo{height:35px;width:35px;border-radius:10px;flex:none}\n.ol-refresh .brand .small{color:#859b90}\n.ol-refresh .sidebar nav{display:flex;flex-direction:column;gap:4px;align-items:stretch}\n.ol-refresh .sidebar .menu-label{margin:16px 10px 6px;font-size:10px;color:#82968c;letter-spacing:.12em}\n.ol-refresh .sidebar .nav-btn{width:100%;height:auto;min-height:43px;border-radius:10px;padding:10px 12px;color:#526960;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:640;white-space:nowrap}\n.ol-refresh .sidebar .nav-btn svg{height:17px;width:17px;flex:none}\n.ol-refresh .sidebar .nav-btn.active{background:#e7f5ee;color:#096e5f;box-shadow:inset 3px 0 #0a8c76}\n.ol-refresh .sidebar .nav-count{margin-left:auto}\n.ol-refresh .ol-advanced-nav{margin:3px 0 0;border-top:1px solid #e7eee9;padding-top:10px}\n.ol-refresh .ol-advanced-nav summary{cursor:pointer;display:flex;align-items:center;gap:8px;list-style:none;padding:9px 11px;font-size:12px;font-weight:750;color:#567268;border-radius:8px}\n.ol-refresh .ol-advanced-nav summary::-webkit-details-marker{display:none}\n.ol-refresh .ol-advanced-nav summary:hover{background:#f3f7f4}\n.ol-refresh .ol-advanced-nav summary span{margin-left:auto}\n.ol-refresh .ol-advanced-nav[open] summary span{transform:rotate(180deg)}\n.ol-refresh .ol-advanced-content{display:grid;gap:5px;padding:7px 0 5px 7px}\n.ol-refresh .ol-tool-item{border-radius:9px;border:1px solid #ecf2ec;background:#f8faf8;padding:3px 5px 7px}\n.ol-refresh .ol-tool-item .nav-btn{min-height:34px;padding:7px 8px}\n.ol-refresh .ol-tool-desc{font-size:10px;line-height:1.55;color:#84978c;margin:0 9px}\n.ol-refresh .ol-sidebar-foot{margin-top:auto;border-top:1px solid #eef2ee;padding:13px 9px;color:#81958a;font-size:11px;line-height:1.6}\n.ol-refresh .topbar{height:65px;background:#fff;border-color:var(--ol-line);padding:0 34px}\n.ol-refresh .content{max-width:1470px;padding:27px 31px 80px}\n.ol-refresh .intro{background:#fff;border:1px solid var(--ol-line);border-radius:17px;padding:22px 25px;margin-bottom:13px;box-shadow:0 3px 18px rgba(19,55,49,.025)}\n.ol-refresh .intro h1{color:#1b353f;font-size:29px;letter-spacing:-1.05px}\n.ol-refresh .intro p{font-size:13px;color:#6b8376;max-width:670px;line-height:1.65}\n.ol-refresh .intro-actions .btn.primary{box-shadow:none;min-height:42px}\n.ol-refresh .ol-export-details summary{cursor:pointer;padding:8px;font-size:12px;color:#5e7d6e;list-style:none}\n.ol-refresh .ol-export-details[open] .btn{width:100%;margin-top:5px}\n.ol-refresh .stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:24px}\n.ol-refresh .stat{background:#fff;border:1px solid var(--ol-line);border-radius:12px;padding:13px 18px;box-shadow:none}\n.ol-refresh .stat .stat-value{font-size:24px;color:#235748}\n.ol-refresh .stat .stat-label{font-size:11px;font-weight:680}\n.ol-refresh .section-row h2{color:#26413f;font-size:18px}\n.ol-refresh .ol-topic-pill{border-radius:9px}\n.ol-refresh .ol-topic-pill[aria-pressed=\"true\"]{background:#1a3b43;border-color:#1a3b43;color:white}\n.ol-refresh .filterbar,.ol-refresh .panel,.ol-refresh .bias-panel{background:#fff;border:1px solid var(--ol-line);box-shadow:0 3px 16px rgba(23,54,44,.025)}\n.ol-refresh .compare-grid{grid-template-columns:minmax(275px,.82fr) minmax(0,1.46fr);gap:16px}\n.ol-refresh .story-card h4{color:#1e3940}\n.ol-refresh .story-card.selected{background:#edf7f1}\n.ol-refresh .ol-detail-tab[aria-selected=\"true\"]{color:#0b7765;background:#fff}\n.ol-refresh .ol-analysis-note{font-size:11px;color:#809088;line-height:1.6;padding:0 5px}\n.ol-dir-page{max-width:1290px}\n.ol-dir-hero{display:flex;justify-content:space-between;gap:20px;align-items:end;background:#fff;border:1px solid var(--ol-line);border-radius:16px;padding:23px 26px;margin-bottom:12px}\n.ol-dir-kicker{font-weight:800;font-size:10px;letter-spacing:.15em;color:#0a8b73}\n.ol-dir-hero h1{font-size:28px;letter-spacing:-.8px;color:#203d43;margin:7px 0}\n.ol-dir-hero p{font-size:13px;line-height:1.65;color:#6f837a;max-width:720px;margin:0}\n.ol-dir-button{border:1px solid #cde6d6;background:#eef8f0;color:#15715e;font-size:12px;font-weight:750;padding:10px;border-radius:9px;cursor:pointer;white-space:nowrap}\n.ol-dir-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:12px}\n.ol-dir-stats div{background:#fff;border:1px solid var(--ol-line);border-radius:12px;padding:14px 16px}\n.ol-dir-stats strong{display:block;font-size:23px;color:#235b49;margin-bottom:5px}\n.ol-dir-stats span{font-size:11px;color:#7c8f83}\n.ol-dir-explain{font-size:12px;line-height:1.65;padding:14px 17px;border-radius:12px;color:#567365;border:1px solid #d7e9dd;background:#eff7f1;margin-bottom:13px}\n.ol-dir-panel{background:#fff;border:1px solid var(--ol-line);border-radius:15px;overflow:hidden}\n.ol-dir-toolbar{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:18px 21px}\n.ol-dir-toolbar h2{font-size:17px;color:#274743;margin:0 0 5px}\n.ol-dir-toolbar p{font-size:12px;color:#7e9385;margin:0}\n.ol-dir-toolbar label{display:flex;flex-direction:column;gap:5px;color:#74877c;font-weight:700;font-size:10px;min-width:min(100%,300px)}\n.ol-dir-toolbar input{border:1px solid #d9e8dd;border-radius:9px;padding:10px 11px;font-size:13px;min-height:40px;background:#fbfdfa;color:#243f40}\n.ol-dir-filters{display:flex;gap:7px;flex-wrap:wrap;padding:0 21px 14px}\n.ol-dir-filters button{background:#f5f9f5;border:1px solid #e1eae2;border-radius:8px;padding:8px 11px;font-size:11px;font-weight:700;color:#597569;cursor:pointer}\n.ol-dir-filters button[aria-pressed=\"true\"]{background:#183d43;border-color:#183d43;color:white}\n.ol-dir-head,.ol-dir-row{display:grid;grid-template-columns:1.2fr 1fr;align-items:center;gap:13px}\n.ol-dir-head{background:#f6f9f6;font-size:10px;font-weight:770;color:#7b9184;padding:10px 21px}\n.ol-dir-row{padding:12px 21px;border-top:1px solid #edf2ed;min-height:63px}\n.ol-dir-row[hidden]{display:none!important}\n.ol-dir-row:hover{background:#fafcf9}\n.ol-dir-name{display:grid;gap:5px;min-width:0}\n.ol-dir-name strong{font-size:13px;color:#264743;overflow-wrap:anywhere}\n.ol-dir-name span{font-size:11px;color:#799083}\n.ol-dir-meta{display:flex;align-items:center;justify-content:space-between;gap:10px}\n.ol-dir-meta a{font-size:11px;color:#0d7764;text-decoration:none;white-space:nowrap;font-weight:720}\n.ol-dir-meta small{color:#afbfb3}\n.ol-dir-badge{border:1px solid #e1e8e1;background:#f5f7f4;border-radius:7px;font-size:11px;padding:6px 8px;color:#728177}\n.ol-dir-badge.rated{background:#e6f6ec;color:#16735e;border-color:#d4eadc}\n.ol-dir-end{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 21px;border-top:1px solid #edf2ec;font-size:11px;color:#7f9286}\n.ol-dir-end button{padding:8px 10px;border:1px solid #d6e9dc;border-radius:8px;font-size:11px;background:#eff8f2;color:#14715c;font-weight:750;cursor:pointer}\n.ol-dir-end button[hidden]{display:none!important}\n.ol-dir-foot{font-size:11px;color:#86988a;line-height:1.65;margin:12px 4px}\n.ol-skip{position:fixed;top:-60px;left:10px;padding:9px;background:#17313d;color:white;z-index:1000}\n.ol-skip:focus{top:8px}\n@media(max-width:1050px){.ol-refresh .app{grid-template-columns:215px minmax(0,1fr)}.ol-refresh .content{padding:23px 20px 70px}.ol-dir-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:850px){\n.ol-refresh .app{grid-template-columns:1fr}\n.ol-refresh .sidebar{display:flex;align-items:center;gap:9px;position:sticky;top:0;padding:8px 12px;z-index:40}\n.ol-refresh .sidebar .brand{padding:0;font-size:18px;white-space:nowrap;flex:none}\n.ol-refresh .ol-brand-logo{width:32px;height:32px}\n.ol-refresh .sidebar nav{display:flex;flex:1;min-width:0;flex-direction:row;align-items:center;gap:3px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;scrollbar-width:none}\n.ol-refresh .sidebar .menu-label,.ol-refresh .ol-sidebar-foot{display:none}\n.ol-refresh .sidebar .nav-btn{width:auto;min-width:max-content;min-height:37px;padding:8px 9px;font-size:12px;gap:5px}\n.ol-refresh .sidebar .nav-btn svg{height:15px;width:15px}\n.ol-refresh .ol-advanced-nav{flex:none;display:flex;align-items:center;min-width:max-content;border:0;margin:0;padding:0}\n.ol-refresh .ol-advanced-nav summary{padding:8px;font-size:11px;white-space:nowrap}\n.ol-refresh .ol-advanced-content{display:flex;align-items:center;gap:3px;padding:0 3px}\n.ol-refresh .ol-advanced-nav:not([open]) .ol-advanced-content{display:none}\n.ol-refresh .ol-tool-item{border:0;background:transparent;padding:0}\n.ol-refresh .ol-tool-desc{display:none}\n.ol-refresh .content{padding:19px 15px 70px}\n.ol-refresh .topbar{display:none}\n.ol-refresh .intro{padding:18px}\n.ol-refresh .stats{grid-template-columns:repeat(3,minmax(0,1fr))}\n.ol-refresh .compare-grid{display:flex;flex-direction:column;gap:13px}\n.ol-refresh .compare-grid>.panel,.ol-refresh .compare-grid>.detail{width:100%}\n.ol-dir-hero{padding:19px}\n}\n@media(max-width:600px){\n.ol-refresh .sidebar{gap:6px;padding:8px}\n.ol-refresh .sidebar .brand{font-size:0}\n.ol-refresh .brand .small{display:none}\n.ol-refresh .intro{padding:17px}\n.ol-refresh .intro h1{font-size:24px}\n.ol-refresh .intro-actions{margin-top:12px}\n.ol-refresh .stat{padding:9px}.ol-refresh .stat .stat-value{font-size:21px}.ol-refresh .stat .sub{font-size:9px}\n.ol-dir-hero{flex-direction:column;align-items:flex-start}\n.ol-dir-hero h1{font-size:24px}\n.ol-dir-button{width:100%}\n.ol-dir-stats{gap:6px}.ol-dir-stats div{padding:11px}.ol-dir-stats strong{font-size:20px}\n.ol-dir-toolbar{flex-direction:column;align-items:stretch;padding:15px}\n.ol-dir-toolbar label{min-width:0}\n.ol-dir-filters{padding:0 15px 12px}\n.ol-dir-head{display:none}\n.ol-dir-row{display:block;padding:12px 15px}\n.ol-dir-name{margin-bottom:10px}\n.ol-dir-meta{justify-content:flex-start;flex-wrap:wrap}\n}\n";document.head.append(style);
function rename(btn,label){
 if(!btn)return;
 const node=[...btn.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());
 if(node)node.textContent=' '+label+' ';else btn.append(document.createTextNode(' '+label));
}
function createTool(btn,label,note){
 rename(btn,label);
 const wrap=document.createElement('div');wrap.className='ol-tool-item';
 const p=document.createElement('p');p.className='ol-tool-desc';p.textContent=note;
 btn.title=note;wrap.append(btn,p);return wrap;
}
function setupNavigation(){
 const nav=document.querySelector('.sidebar nav');if(!nav||nav.classList.contains('ol-nav-ready'))return;
 const dash=nav.querySelector('[data-view="dashboard"]'),saved=nav.querySelector('[data-view="saved"]'),
  claim=nav.querySelector('[data-view="claims"]'),review=nav.querySelector('[data-view="reviews"]'),
  guide=nav.querySelector('[data-view="methods"]');
 if(!dash||!saved||!claim||!review||!guide)return;
 const pub=document.createElement('button');pub.type='button';pub.className='nav-btn';pub.dataset.view='publishers';
 pub.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg> Publishers';
 rename(dash,'Explore');rename(saved,'Saved stories');rename(guide,'How it works');
 const heading=document.createElement('div');heading.className='menu-label';heading.textContent='WORKSPACE';
 const more=document.createElement('div');more.className='menu-label';more.textContent='MORE';
 const advanced=document.createElement('details');advanced.className='ol-advanced-nav';
 const summary=document.createElement('summary');
 summary.innerHTML='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"><path d="M3 6h18M3 12h18M3 18h18"/></svg> Advanced research <span>⌄</span>';
 const content=document.createElement('div');content.className='ol-advanced-content';
 content.append(createTool(claim,'Research questions','Private notes to revisit, not automatically fact-checked.'),
  createTool(review,'Editorial lab','Manual evidence research, not a published bias rating.'));
 advanced.append(summary,content);
 nav.replaceChildren(heading,dash,pub,saved,guide,more,advanced);
 nav.classList.add('ol-nav-ready');
 const foot=document.createElement('p');foot.className='ol-sidebar-foot';
 foot.textContent='Source ratings ≠ article truth. News coverage is sampled.';
 document.querySelector('.sidebar')?.append(foot);
 if(state.view==='claims'||state.view==='reviews')advanced.open=true;
}
function dashboard(){
 const hero=document.querySelector('.intro');
 if(hero){
  const eyebrow=hero.querySelector('.eyebrow'),h=hero.querySelector('h1'),p=hero.querySelector('p');
  if(eyebrow)eyebrow.textContent='NEWS COVERAGE, IN PERSPECTIVE';
  if(h)h.textContent='Read beyond the headline.';
  if(p)p.textContent='Pick a topic, compare available publisher reporting, and open the original articles. Matches and coverage counts are approximate.';
  const actions=hero.querySelector('.intro-actions');
  const exportButton=actions?.querySelector('[data-action="export"]');
  if(exportButton&&!actions.querySelector('.ol-export-details')){
   const details=document.createElement('details');details.className='ol-export-details';
   const summary=document.createElement('summary');summary.textContent='Export';details.append(summary,exportButton);
   actions.prepend(details);
  }
 }
 const stats=document.querySelector('.stats');if(stats?.children.length===4)stats.lastElementChild.remove();
 const h=document.querySelector('.section-row h2');if(h)h.textContent='Browse coverage';
 const p=document.querySelector('.section-row p');if(p)p.textContent='Select a story to compare publisher headlines and source context.';
 const list=document.querySelector('.story-list')?.closest('.panel')?.querySelector('.panel-head h3');if(list)list.textContent='Stories in this sample';
 const labels={coverage:'Articles',perspectives:'Political mix',evidence:'Evidence notes',timeline:'Updates'};
 for(const tab of document.querySelectorAll('.ol-detail-tab')){
  const name=tab.id?.replace('ol-tab-','');if(labels[name])tab.textContent=labels[name];
 }
 const tabs=document.querySelector('.ol-detail-tabs');
 if(tabs&&!document.querySelector('.ol-analysis-note')){
  const note=document.createElement('div');note.className='ol-analysis-note';
  note.textContent='Headline matching is tentative; a publisher rating does not assess an individual article.';
  tabs.after(note);
 }
}
function subpage(){
 const h=document.querySelector('#content h1.page-title'),p=document.querySelector('#content p.page-sub');
 if(state.view==='claims'){
  if(h)h.textContent='Research questions';
  if(p)p.textContent='A private list of questions and evidence links to revisit. OpenLens does not verify or update these automatically.';
 }else if(state.view==='saved'){
  if(h)h.textContent='Saved stories';
  if(p)p.textContent='Your bookmarked story comparisons, stored on this device.';
 }else if(state.view==='methods'){
  if(h)h.textContent='How OpenLens works';
  if(p)p.textContent='Our data sources, publisher assessment methods and important limitations.';
 }else if(state.view==='reviews'){
  const title=document.querySelector('#content .ol-review-title h1');
  if(title)title.textContent='Editorial research lab';
 }
}
function improve(){
 document.body.classList.add('ol-commercial');
 setupNavigation();
 if(state.view==='dashboard')dashboard();else subpage();
 const crumb=document.getElementById('breadcrumb');
 const names={dashboard:'Explore',publishers:'Publishers',saved:'Saved stories',claims:'Research questions',reviews:'Editorial lab',methods:'How it works'};
 if(crumb&&names[state.view])crumb.textContent=names[state.view];
}
const prior=render;render=function(){prior();improve()};improve();
})();
