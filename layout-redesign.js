
(function(){
 'use strict';
 if(typeof render!=='function'||typeof state==='undefined')return;
 const style=document.createElement('style');
 style.textContent="\n:root{\n --ink:#20332f;--ink2:#435e54;--muted:#65776e;--line:#dfe7df;\n --paper:#fffefa;--canvas:#f6f7f1;--blue:#0c7769;--blue2:#e8f4ef;\n --green:#16755d;--accent:#86a89a;--shadow:0 6px 22px rgba(32,66,50,.045);\n --radius:16px;\n}\nbody.ol-refresh{background:var(--canvas);color:var(--ink);font-size:14px}\n.ol-refresh .app{grid-template-columns:220px minmax(0,1fr)}\n.ol-refresh .sidebar{background:#fcfdf9;border-color:var(--line);padding:25px 14px}\n.ol-refresh .brand{color:#183d34;font-size:21px;letter-spacing:-.75px;padding:0 12px 16px}\n.ol-refresh .brandmark{background:#0c7769;color:#fff;box-shadow:0 4px 15px rgba(12,119,105,.15);border-radius:12px}\n.ol-refresh .brand .small{color:#81968c}\n.ol-refresh .menu-label{color:#8a9a90;font-size:10px;letter-spacing:.14em;margin-top:22px}\n.ol-refresh .sidebar-bottom{display:none}\n.ol-refresh .nav-btn{border-radius:11px;height:43px;font-size:13px;color:#526960;font-weight:640}\n.ol-refresh .nav-btn.active{background:#e4f2eb;color:#0c675c;box-shadow:inset 3px 0 #198a78}\n.ol-refresh .nav-btn:hover{background:#edf4ee;color:#174e42}\n.ol-refresh .nav-count{background:#e9eee9;color:#60756b}\n.ol-refresh .nav-btn.active .nav-count{background:#d2e9de;color:#176653}\n.ol-refresh .workspace{min-width:0}\n.ol-refresh .topbar{height:62px;background:#fffefa;border-color:var(--line);padding:0 28px}\n.ol-refresh .breadcrumbs{font-size:12px;color:#657b70}\n.ol-refresh .today-date{color:#7c8a7d}\n.ol-refresh .source-mode{border-color:#dce9de;background:#f8fcf8;color:#446459}\n.ol-refresh .source-mode.live .dot{background:#14816c}\n.ol-refresh .avatar{background:#e8f1e8;border-color:#d9e6d9;color:#376859}\n.ol-refresh .content{max-width:1490px;padding:26px 29px 80px}\n.ol-refresh .intro{gap:18px;align-items:center;margin-bottom:16px}\n.ol-refresh .eyebrow{font-size:10px;letter-spacing:1.35px;color:#3d907b}\n.ol-refresh .eyebrow .line{background:#3d907b}\n.ol-refresh .intro h1{font-size:30px;font-weight:780;letter-spacing:-1.15px;margin:8px 0 7px;color:#203d36}\n.ol-refresh .intro p{color:#687b70;font-size:13px;max-width:680px;line-height:1.55}\n.ol-refresh .intro-actions{gap:8px}\n.ol-refresh .btn{border-color:#dfe8e0;border-radius:10px;color:#315448;background:#fffefa;min-height:38px;height:auto;padding:9px 13px}\n.ol-refresh .btn.primary{background:#0d7869;border-color:#0d7869;color:#fff;box-shadow:0 5px 13px rgba(12,119,105,.16)}\n.ol-refresh .btn.primary:hover{background:#095f53}\n.ol-refresh .btn:hover{background:#f1f7f2;border-color:#c8ddcf}\n.ol-refresh .btn.primary:hover{color:white}\n.ol-refresh a,.ol-refresh .small-link{color:#097666}\n.ol-refresh .stats{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 20px}\n.ol-refresh .stat{padding:12px 15px;border-radius:14px;box-shadow:none;background:#fffefa;border:1px solid var(--line)}\n.ol-refresh .stat .stat-label{font-size:10.5px;color:#72877a}\n.ol-refresh .stat .stat-label svg{color:#8ca79a}\n.ol-refresh .stat .stat-value{font-size:24px;color:#234a3f;margin:6px 0 3px}\n.ol-refresh .stat .sub{font-size:10px;color:#8a978d}\n.ol-refresh .section-row{margin-bottom:12px}\n.ol-refresh .section-row h2{font-size:18px;color:#2a4036}\n.ol-refresh .section-row p{font-size:12px;color:#77887d}\n.ol-refresh .panel,.ol-refresh .bias-panel,.ol-refresh .focus-panel .method-card,.ol-refresh .saved-item{background:#fffefa;border-color:var(--line);border-radius:15px;box-shadow:var(--shadow)}\n.ol-refresh .panel-head{padding:15px 17px;border-color:#edf0e8}\n.ol-refresh .panel-head h3{font-size:14px;color:#28473d}\n.ol-refresh .panel-head .subtle{color:#819487;font-size:11px}\n.ol-refresh .filterbar{background:#fffefa;border:1px solid var(--line);padding:12px 13px;margin-bottom:13px;box-shadow:none;border-radius:14px;gap:9px}\n.ol-refresh .filterbar .search-box{flex:1 1 220px;background:#f9fbf7;border:1px solid #dce7dd;height:41px;border-radius:10px}\n.ol-refresh .search-box input{font-size:13px}\n.ol-refresh .filter{height:41px;border:1px solid #dce7dd;color:#375a4e;background:#fffefa;min-width:118px;max-width:210px;border-radius:10px;font-size:12px}\n.ol-refresh .ol-extra-filters{position:relative;flex:0 0 auto}\n.ol-refresh .ol-extra-filters summary{cursor:pointer;list-style:none;background:#eef5ee;border:1px solid #cfe2d5;color:#2b6555;border-radius:10px;padding:10px 14px;min-height:41px;font-size:12px;font-weight:720}\n.ol-refresh .ol-extra-filters summary::-webkit-details-marker{display:none}\n.ol-refresh .ol-extra-filters[open]{flex:1 1 100%}\n.ol-refresh .ol-extra-filters[open] summary{width:max-content}\n.ol-refresh .ol-extra-grid{display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:10px;padding:12px 0 2px;max-width:780px}\n.ol-refresh .ol-extra-grid label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700;color:#63786b}\n.ol-refresh .ol-extra-grid .filter{width:100%;max-width:none}\n.ol-refresh .bias-overall{padding:15px 18px;margin:0 0 16px;background:#fffefa}\n.ol-refresh .bias-overall h3{font-size:15px;font-weight:790}\n.ol-refresh .bias-overall .bias-legend{gap:6px 12px}\n.ol-refresh .bias-overall .bias-strip{height:10px}\n.ol-refresh .bias-overall .bias-buttons{gap:6px;margin:10px 0}\n.ol-refresh .bias-overall .bias-buttons button{border-radius:9px;padding:8px 11px;font-size:11px;font-weight:730;border-color:#dfebe2;color:#35544a;background:#f7faf6}\n.ol-refresh .bias-overall .bias-buttons button.active{background:#dbeee4;color:#0a705f;border-color:#94cbbb}\n.ol-refresh .bias-overall .bias-method{color:#6d7f74;line-height:1.6}\n.ol-refresh .ol-rating-explainer{margin-top:9px;padding-top:8px;border-top:1px solid #edf0e9;color:#60746b}\n.ol-refresh .ol-rating-explainer summary{font-size:11px;font-weight:740;cursor:pointer;color:#476f61}\n.ol-refresh .bias-unknown-details{margin-top:8px}\n.ol-refresh .compare-grid{display:grid;grid-template-columns:minmax(280px,.77fr) minmax(0,1.43fr);gap:17px;align-items:start}\n.ol-refresh .story-list{max-height:min(77vh,1000px);overflow:auto}\n.ol-refresh .story-card{padding:15px 16px;border-color:#ecf0e9;background:#fffefa}\n.ol-refresh .story-card:hover{background:#f6faf6}\n.ol-refresh .story-card.selected{background:#eaf5ed;box-shadow:inset 3px 0 #138773}\n.ol-refresh .story-card h4{font-size:14px;line-height:1.4;color:#254539;margin-bottom:7px}\n.ol-refresh .story-card .preview{font-size:11px;color:#7a8d80}\n.ol-refresh .story-meta{color:#73867a}\n.ol-refresh .save-card.saved{color:#0e806d}\n.ol-refresh .story-card .ol-card-preview{background:#e5f3e9;border-color:#d2e8d9;color:#136b58}\n.ol-refresh .detail{gap:12px}\n.ol-refresh .detail-top{padding:19px 20px}\n.ol-refresh .detail-top h2{color:#203c33;font-size:21px}\n.ol-refresh .detail-top .lede{color:#718478;font-size:12px}\n.ol-refresh .detail .signal-note{background:#f5f8f3;border-color:#e1e9df;color:#6e7d70}\n.ol-refresh .ol-quick-panel{background:#f3f8f3;border-color:#dde9e0;border-radius:12px;padding:12px;margin-top:15px}\n.ol-refresh .ol-quick-panel strong{color:#2d5645}\n.ol-refresh .ol-quick-panel p{color:#76857a}\n.ol-refresh .ol-quick-actions .ol-preview-trigger{background:#0c7769;border-color:#0c7769;border-radius:8px}\n.ol-refresh .ol-quick-actions .ol-preview-trigger:hover{background:#095c50}\n.ol-refresh .ol-detail-tabs{display:flex;gap:4px;padding:5px;background:#e9f0e9;border-radius:12px;overflow:auto;scrollbar-width:thin;border:1px solid #dce9dc}\n.ol-refresh .ol-detail-tab{flex:1 0 auto;border:0;background:transparent;color:#557368;border-radius:9px;padding:10px 12px;font-size:12px;font-weight:750;white-space:nowrap;min-height:41px}\n.ol-refresh .ol-detail-tab[aria-selected=\"true\"]{color:#0b6d5d;background:#fffefa;box-shadow:0 2px 8px rgba(30,75,55,.09)}\n.ol-refresh .ol-detail-tab:focus-visible{outline:2px solid #1d8c77;outline-offset:-2px}\n.ol-refresh .ol-panel-hidden{display:none!important}\n.ol-refresh .coverage-row{border-color:#edf0e9}\n.ol-refresh .coverage-row h4{font-size:13px;line-height:1.5}\n.ol-refresh .coverage-row .outlet-name{color:#2a5548}\n.ol-refresh .coverage-row .ol-preview-trigger{background:#eaf6ed;border-color:#d6e9dc;color:#126c58}\n.ol-refresh .coverage-row .coverage-footer{gap:8px}\n.ol-refresh .bias-related{background:#fffafa;border-color:#ecdfe0}\n.ol-refresh .bias-no-match{background:#fafbf8;border-color:#e1e8dc}\n.ol-refresh .story-analytics{gap:12px}\n.ol-refresh .ol-selected-ratings{grid-column:1/-1;margin:0;padding:14px 16px;border-color:#dfe8dd}\n.ol-refresh .tag.blue{background:#e1f1e7;color:#24725c}\n.ol-refresh .tag.green{background:#e0f2e8;color:#2b755d}\n.ol-refresh .source-callout{background:#f6f9f5;border-color:#e4ede2}\n.ol-refresh .disclosure{font-size:10px;color:#88988e;line-height:1.7;margin-top:22px}\n.ol-refresh .ol-mobile-back{display:none}\n@media(max-width:1100px){\n .ol-refresh .app{grid-template-columns:190px minmax(0,1fr)}\n .ol-refresh .content{padding:24px 18px 65px}\n .ol-refresh .compare-grid{grid-template-columns:minmax(240px,.86fr) minmax(0,1.14fr);gap:12px}\n .ol-refresh .stats{gap:7px}\n .ol-refresh .stat{padding:12px}\n}\n@media(max-width:850px){\n .ol-refresh .app{grid-template-columns:1fr}\n .ol-refresh .sidebar{position:sticky;top:0;height:auto;z-index:40;padding:8px 14px;display:flex;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(38,69,50,.05);border-bottom:1px solid var(--line)}\n .ol-refresh .sidebar .brand{padding:0;white-space:nowrap;font-size:18px;flex:none}\n .ol-refresh .brandmark{width:30px;height:30px;font-size:17px}\n .ol-refresh .sidebar nav{display:flex;flex:1;min-width:0;overflow-x:auto;gap:4px;scrollbar-width:none;align-items:center}\n .ol-refresh .sidebar nav::-webkit-scrollbar{display:none}\n .ol-refresh .sidebar .menu-label{display:none}\n .ol-refresh .nav-btn{flex:none;width:auto;min-width:auto;padding:0 10px;height:38px;font-size:12px;gap:5px}\n .ol-refresh .nav-btn svg{height:15px;width:15px}\n .ol-refresh .nav-count{font-size:10px;padding:1px 5px}\n .ol-refresh .topbar{display:none}\n .ol-refresh .content{padding:20px 16px 75px}\n .ol-refresh .intro{align-items:flex-start;gap:12px}\n .ol-refresh .intro h1{font-size:27px}\n .ol-refresh .stats{grid-template-columns:repeat(4,minmax(0,1fr))}\n .ol-refresh .compare-grid{grid-template-columns:1fr;display:flex;flex-direction:column;gap:14px}\n .ol-refresh .compare-grid>.panel,.ol-refresh .compare-grid>.detail{width:100%}\n .ol-refresh .story-list{max-height:360px;overflow:auto}\n .ol-refresh .detail{scroll-margin-top:76px}\n .ol-refresh .ol-mobile-back{display:inline-flex;border:1px solid #d2e6d7;border-radius:9px;background:#eef6ef;color:#246956;font-size:12px;font-weight:730;padding:9px 12px;margin-bottom:3px}\n .ol-refresh .ol-detail-tabs{position:sticky;top:55px;z-index:20;background:#ebf1e9;scroll-margin-top:60px}\n}\n@media(max-width:600px){\n .ol-refresh .sidebar{gap:8px;padding:8px 9px}\n .ol-refresh .sidebar .brand{font-size:0;gap:0}\n .ol-refresh .brandmark{font-size:18px}\n .ol-refresh .brand .small{display:none}\n .ol-refresh .content{padding:16px 12px 65px}\n .ol-refresh .intro{display:block}\n .ol-refresh .intro h1{font-size:25px;letter-spacing:-.7px}\n .ol-refresh .intro p{font-size:12px}\n .ol-refresh .intro-actions{margin-top:12px;display:flex;gap:7px}\n .ol-refresh .intro-actions .btn{flex:1;justify-content:center}\n .ol-refresh .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:15px}\n .ol-refresh .stat{padding:11px 12px}\n .ol-refresh .stat .stat-value{font-size:23px;margin:5px 0 0}\n .ol-refresh .section-row h2{font-size:16px}\n .ol-refresh .filterbar{padding:10px;gap:7px}\n .ol-refresh .filterbar .search-box{flex:1 1 100%;max-width:100%;min-width:0}\n .ol-refresh .filterbar>#topicFilter{flex:1 1 135px;min-width:0;max-width:none}\n .ol-refresh .ol-extra-filters{flex:1 1 auto}\n .ol-refresh .ol-extra-filters summary{white-space:nowrap;text-align:center}\n .ol-refresh .ol-extra-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}\n .ol-refresh .bias-overall{padding:13px 12px}\n .ol-refresh .bias-overall h3{font-size:13px}\n .ol-refresh .bias-overall .bias-legend{gap:4px 9px}\n .ol-refresh .bias-overall .bias-buttons button{font-size:10px;padding:7px}\n .ol-refresh .detail-top{padding:15px}\n .ol-refresh .detail-top h2{font-size:18px}\n .ol-refresh .ol-detail-tabs{top:55px}\n .ol-refresh .ol-detail-tab{font-size:11px;padding:10px 9px}\n .ol-refresh .story-card{padding:13px}\n .ol-refresh .coverage-row{padding:13px}\n .ol-refresh .coverage-row h4{font-size:13px}\n .ol-refresh .ol-quick-actions{display:flex;flex-direction:column;align-items:stretch}\n .ol-refresh .ol-quick-actions .ol-preview-trigger{width:100%;text-align:center}\n}\n@media(prefers-reduced-motion:reduce){.ol-refresh *{scroll-behavior:auto!important;transition:none!important}}\n";
 style.textContent+="\n.ol-refresh .ol-topic-rail{margin:0 0 16px;display:flex;flex-direction:column;gap:8px}\n.ol-refresh .ol-topic-head{display:flex;align-items:center;justify-content:space-between;gap:12px}\n.ol-refresh .ol-topic-head strong{font-size:12px;color:#3e6252;letter-spacing:.01em}\n.ol-refresh .ol-topic-head small{font-size:10px;color:#84968a}\n.ol-refresh .ol-topic-list{display:flex;gap:7px;overflow-x:auto;scrollbar-width:thin;padding:2px 1px 8px;-webkit-overflow-scrolling:touch}\n.ol-refresh .ol-topic-pill{flex:none;border:1px solid #d8e6d9;border-radius:100px;background:#fffefa;color:#345d4c;font-size:12px;font-weight:700;padding:9px 13px;min-height:38px;white-space:nowrap;transition:background .15s,border-color .15s}\n.ol-refresh .ol-topic-pill:hover{background:#ebf5ed;border-color:#b5dac8}\n.ol-refresh .ol-topic-pill[aria-pressed=\"true\"]{background:#0c7769;color:#fff;border-color:#0c7769}\n.ol-refresh .ol-topic-help{color:#71867a;font-size:11px;margin:0}\n@media(max-width:600px){.ol-refresh .ol-topic-rail{margin-bottom:11px}.ol-refresh .ol-topic-head{align-items:baseline}.ol-refresh .ol-topic-list{margin-right:-12px;padding-right:14px}.ol-refresh .ol-topic-pill{font-size:11px;padding:9px 11px}.ol-refresh .ol-topic-head small{max-width:170px;text-align:right}}\n";
 document.head.appendChild(style);
 document.body.classList.add('ol-refresh');
 let activeTab='coverage',lastSelected=null,advancedOpen=false;
 const tabMap=[['coverage','Coverage'],['perspectives','Perspectives'],['evidence','Evidence'],['timeline','Timeline & claims']];
 function updateLabels(){
  const names={dashboard:'Explore',saved:'Saved',claims:'Claims',methods:'How it works'};
  document.querySelectorAll('.sidebar [data-view]').forEach(btn=>{
    const v=btn.dataset.view, label=names[v];
    if(!label)return;
    const nodes=[...btn.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());
    if(nodes.length)nodes[0].textContent=' '+label+' ';
  });
  const bc=document.getElementById('breadcrumb');
  if(bc&&names[state.view])bc.textContent=names[state.view];
 }

 const topicShortcuts=[
  ['all','All news'],['migration','Migration'],['dutch-politics','Dutch politics'],
  ['gaza','Gaza'],['ukraine','Ukraine'],['geopolitics','Geopolitics'],
  ['middle-east','Middle East'],['eu-policy','EU policy'],['world','World'],
  ['politics','Politics'],['climate','Climate'],['technology','Technology']
 ];
 function topicRail(){
  const filter=document.querySelector('.filterbar');if(!filter)return;
  const region=document.createElement('section');region.className='ol-topic-rail';
  region.setAttribute('aria-label','Choose a news topic');
  const head=document.createElement('div');head.className='ol-topic-head';
  const title=document.createElement('strong');title.textContent='Explore by topic';
  const hint=document.createElement('small');hint.textContent='Scroll for more topics →';
  head.append(title,hint);
  const pills=document.createElement('div');pills.className='ol-topic-list';
  pills.setAttribute('role','group');pills.setAttribute('aria-label','News topic shortcuts');
  for(const [key,label] of topicShortcuts){
   const button=document.createElement('button');
   button.type='button';button.className='ol-topic-pill';button.dataset.olTopic=key;
   button.textContent=label;button.setAttribute('aria-pressed',String(key===state.topic));pills.append(button);
  }
  region.append(head,pills);
  if(state.topic==='dutch-politics'&&state.country==='all'&&state.language==='all'){
   const note=document.createElement('p');note.className='ol-topic-help';
   note.textContent='Dutch politics uses the Netherlands / Dutch news edition by default. Change it in More filters.';
   region.append(note);
  }
  filter.before(region);
 }
 function filterLayout(){
  const bar=document.querySelector('.filterbar');if(!bar)return;
  const fields=['countryFilter','languageFilter','outletFilter','periodFilter','biasFilter']
    .map(id=>document.getElementById(id)).filter(Boolean);
  if(!fields.length)return;
  const detail=document.createElement('details');detail.className='ol-extra-filters';detail.open=advancedOpen;
  const active=fields.filter(el=>el.value!=='all'&&!(el.id==='periodFilter'&&el.value==='7'));
  const summary=document.createElement('summary');
  summary.textContent='More filters'+(active.length?' · '+active.length:'')+' ▾';
  summary.setAttribute('aria-label','Expand country, language, date, outlet and leaning filters');
  const grid=document.createElement('div');grid.className='ol-extra-grid';
  const labels={countryFilter:'Country / edition',languageFilter:'Language',outletFilter:'Outlet',periodFilter:'Date range',biasFilter:'Publisher leaning'};
  for(const field of fields){
    const label=document.createElement('label');label.textContent=labels[field.id]||'Filter';
    field.setAttribute('aria-label',labels[field.id]||'Filter');
    label.append(field);grid.append(label);
  }
  detail.append(summary,grid);
  detail.addEventListener('toggle',()=>{advancedOpen=detail.open});
  bar.append(detail);
  const overall=document.querySelector('.bias-overall');
  if(overall){
    bar.after(overall);
    const methods=[...overall.children].filter(el=>el.matches('p.bias-method'));
    if(methods.length>1){
      const help=document.createElement('details');help.className='ol-rating-explainer';
      const head=document.createElement('summary');head.textContent='How we classify outlets and interpret these counts';
      help.append(head);
      for(const p of methods.slice(1))help.append(p);
      overall.append(help);
    }
  }
 }
 function detailTabs(){
  const detail=document.querySelector('.compare-grid > .detail');if(!detail)return;
  const s=typeof current==='function'?current():null;
  if(s?.id!==lastSelected){lastSelected=s?.id;activeTab='coverage'}
  const sections=[...detail.children];
  const heading=sections.find(el=>el.querySelector('.detail-top'));
  const coverage=sections.find(el=>el.querySelector('.panel-head h3')?.textContent?.trim()==='Compare reporting');
  const evidence=sections.find(el=>el.querySelector('.panel-head h3')?.textContent?.includes('Evidence / omission'));
  const analytic=sections.filter(el=>el.matches('.story-analytics'));
  if(!heading||!coverage)return;
  const selectedRatings=document.querySelector('.bias-panel[aria-label="Political coverage distribution"]');
  if(selectedRatings&&analytic[0]){selectedRatings.classList.add('ol-selected-ratings');analytic[0].prepend(selectedRatings)}
  const groups={coverage:[coverage],perspectives:analytic[0]?[analytic[0]]:[],evidence:evidence?[evidence]:[],timeline:analytic[1]?[analytic[1]]:[]};
  const tabs=document.createElement('div');
  tabs.className='ol-detail-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Story comparison sections');
  const buttons=new Map();
  function choose(key,focus=false){
    activeTab=key;
    Object.entries(groups).forEach(([group,els])=>els.forEach(el=>{
      el.classList.toggle('ol-panel-hidden',group!==key);
      el.setAttribute('role','tabpanel');
      el.id='ol-section-'+group;
      el.setAttribute('aria-labelledby','ol-tab-'+group);
    }));
    buttons.forEach((btn,id)=>{
      const selected=id===key;
      btn.setAttribute('aria-selected',String(selected));
      btn.tabIndex=selected?0:-1;
      if(focus&&selected)btn.focus();
    });
  }
  for(const [key,label] of tabMap){
    if(!groups[key].length)continue;
    const btn=document.createElement('button');
    btn.type='button';btn.className='ol-detail-tab';btn.textContent=label;
    btn.id='ol-tab-'+key;btn.setAttribute('role','tab');
    btn.setAttribute('aria-controls','ol-section-'+key);
    btn.addEventListener('click',()=>choose(key));
    btn.addEventListener('keydown',e=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;
      e.preventDefault();const available=[...buttons.keys()];
      const currentIdx=available.indexOf(key);
      let next=e.key==='Home'?0:e.key==='End'?available.length-1:
       (currentIdx+(e.key==='ArrowRight'?1:-1)+available.length)%available.length;
      choose(available[next],true);
    });
    buttons.set(key,btn);tabs.append(btn);
  }
  heading.after(tabs);
  if(!groups[activeTab]?.length)activeTab='coverage';
  choose(activeTab);
  const actions=document.querySelector('.ol-quick-panel .ol-quick-actions');
  if(actions)[...actions.querySelectorAll('button.ol-preview-trigger')].slice(3).forEach(btn=>btn.remove());
  const p=document.querySelector('.ol-quick-panel > p');
  if(p)p.textContent='Preview up to three sources here, or choose Coverage to browse all available articles.';
  const back=document.createElement('button');back.className='ol-mobile-back';
  back.type='button';back.textContent='← Back to stories';
  back.addEventListener('click',()=>document.querySelector('.story-list')?.scrollIntoView({behavior:'smooth',block:'start'}));
  detail.prepend(back);
 }
 function enhance(){
  document.body.classList.add('ol-refresh');updateLabels();
  if(state.view!=='dashboard')return;
  const intro=document.querySelector('.intro');
  if(intro){
    const eyebrow=intro.querySelector('.eyebrow');
    if(eyebrow)eyebrow.textContent='A clearer view of the headlines';
    const heading=intro.querySelector('h1');
    if(heading)heading.textContent='Explore the news';
    const p=intro.querySelector('p');
    if(p)p.textContent='Choose a story, compare publisher perspectives and inspect the evidence in one place.';
  }
  const row=document.querySelector('.section-row');
  if(row){
    const header=row.querySelector('h2');if(header&&header.textContent==='Coverage monitor')header.textContent='Stories to explore';
    const p=row.querySelector('p');if(p)p.textContent='Choose a story below to start comparing coverage.';
  }
  const listHeader=document.querySelector('.story-list')?.closest('.panel')?.querySelector('.panel-head h3');
  if(listHeader)listHeader.textContent='Latest stories';
  topicRail();
  filterLayout();
  detailTabs();
 }
 const originalRender=render;
 render=function(){originalRender();enhance()};
 document.addEventListener('click',e=>{
  const button=e.target.closest?.('button[data-ol-topic]');
  if(!button)return;
  const filter=document.getElementById('topicFilter');if(!filter||filter.value===button.dataset.olTopic)return;
  filter.value=button.dataset.olTopic;
  filter.dispatchEvent(new Event('change',{bubbles:true}));
 });
 enhance();
})();
