/* OpenLens 2026 newsroom visuals — user-accessible theme, publisher imagery,
 * grouped topics, sampled-source coverage, evidence-aware blindspots.
 */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined'||!window.OpenLensCoverage)return;
const metrics=window.OpenLensCoverage;
const THEME='openlens.display.theme.v1',CAP=36;
const escaped=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blindspotStyle=document.createElement('style');blindspotStyle.textContent="\n/* Better blindspots: evidence gaps separated from publisher metadata and single-source samples */\n.ol-spots-v2 .ol-spots-hero h1{margin-bottom:12px}\n.ol-spots-v2 .ol-spots-metrics{grid-template-columns:repeat(4,minmax(0,1fr))}\n.ol-spots-v2 .ol-spots-tabs{margin-top:16px}\n.ol-spots-v2 .ol-spots-grid{grid-template-columns:repeat(2,minmax(0,1fr))}\n.ol-spots-v2 .ol-spot-item{align-content:start}\n.ol-spots-v2 .ol-spots-primary{padding:20px;background:#fff;border:1px solid #dfebe2;border-radius:14px;margin-top:12px}\n.ol-spots-v2 .ol-spots-primary h2{font-size:18px;color:#2b5246;margin:0 0 9px}\n.ol-spots-v2 .ol-spots-primary>p{font-size:12px;color:#71867b;line-height:1.7;margin:0 0 12px}\n.ol-spots-v2 .ol-spots-primary .ol-spots-grid{margin-top:13px}\n.ol-spots-v2 .ol-spots-quiet{background:#f1f8f3;border:1px solid #d8e9df;border-radius:12px;padding:20px;color:#426d5a;line-height:1.7;font-size:12px}\n.ol-spots-v2 .ol-spots-quiet strong{display:block;margin-bottom:5px;font-size:14px;color:#1d6450}\n.ol-spots-v2 .ol-audit-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}\n.ol-spots-v2 .ol-audit-grid .ol-spots-primary{margin-top:0}\n.ol-spots-v2 .ol-audit-row{display:flex;justify-content:space-between;align-items:flex-start;gap:13px;border-bottom:1px solid #e6eee7;padding:12px 0}\n.ol-spots-v2 .ol-audit-row:last-child{border-bottom:none}\n.ol-spots-v2 .ol-audit-row strong{color:#2c5142;font-size:12px}\n.ol-spots-v2 .ol-audit-row p{margin:4px 0;color:#688477;font-size:11px;line-height:1.65}\n.ol-spots-v2 .ol-audit-count{background:#edf6ef;color:#2b7258;border:1px solid #d8e9de;border-radius:8px;padding:6px 8px;font-size:11px;white-space:nowrap}\n.ol-spots-v2 .ol-audit-link{font-size:11px;color:#08745f;font-weight:720;text-decoration:underline}\n.ol-spots-v2 .ol-spot-item .ol-coverage-unit{margin-top:9px}\n.ol-spots-v2 .ol-spots-status{font-size:11px;color:#698175;padding:11px 13px;background:#f6faf7;border:1px solid #e2ebe4;border-radius:10px;margin:12px 0}\n.ol-spots-v2 .ol-spots-cta{background:#eaf5ee;color:#11745b;border:1px solid #c9e2d1;border-radius:9px;padding:9px 11px;font-size:12px;font-weight:750;cursor:pointer}\nhtml[data-ol-theme=\"dark\"] .ol-spots-v2 :is(.ol-spots-primary,.ol-audit-row,.ol-spots-quiet,.ol-spots-status){background:#172832!important;border-color:#30454a!important;color:#bcd2c9!important}\nhtml[data-ol-theme=\"dark\"] .ol-spots-v2 :is(.ol-spots-primary h2,.ol-audit-row strong,.ol-spots-quiet strong){color:#e0f2e8!important}\nhtml[data-ol-theme=\"dark\"] .ol-spots-v2 :is(.ol-audit-row p,.ol-spots-primary>p){color:#aebeb7!important}\n@media(max-width:740px){.ol-spots-v2 .ol-spots-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.ol-spots-v2 .ol-audit-grid,.ol-spots-v2 .ol-spots-grid{grid-template-columns:1fr}}\n";document.head.append(blindspotStyle);
const styles=document.createElement('style');styles.textContent="\n/* OpenLens visual identity v2: grounded imagery, explicit percentages, neutral palette */\n.ol-card-cover{position:relative;min-height:170px;height:170px;background:linear-gradient(130deg,#203d45,#3c6c65);border-radius:12px;overflow:hidden;margin:-1px -1px 10px;isolation:isolate}\n.ol-feed-featured .ol-card-cover{height:290px}\n.ol-card-cover::before{content:\"\";position:absolute;width:280px;height:280px;border-radius:48%;background:radial-gradient(circle,rgba(143,222,182,.18),transparent 70%);right:-50px;top:-100px;pointer-events:none}\n.ol-card-cover::after{content:\"\";position:absolute;left:8%;top:28%;height:48px;width:48px;border:3px solid #b1ebd6;border-radius:50%;box-shadow:20px 6px 0 -14px #b1ebd6;opacity:.55;pointer-events:none}\n.ol-card-cover img{display:block;height:100%;width:100%;object-fit:cover;object-position:center;position:relative;z-index:1}\n.ol-card-cover.has-photo::after,.ol-card-cover.has-photo::before{display:none}\n.ol-card-cover .ol-cover-caption{position:absolute;z-index:2;bottom:12px;left:13px;max-width:90%;background:rgba(12,34,39,.78);color:#f2f8f4;font-size:10px;line-height:1.4;padding:6px 9px;border:1px solid rgba(255,255,255,.19);border-radius:7px}\n.ol-card-cover:not(.has-photo) .ol-cover-caption{background:rgba(10,35,41,.26)}\n.ol-card-cover .ol-cover-fallback{position:absolute;z-index:0;bottom:48px;right:18px;color:rgba(242,250,245,.55);font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:780}\n.ol-coverage-unit{display:grid;gap:6px;margin:10px 0 8px}\n.ol-coverage-stripe{width:100%;height:14px;background:#e8edf0;border-radius:4px;overflow:hidden;display:flex}\n.ol-coverage-segment{height:100%;min-width:0;display:block}\n.ol-coverage-segment.left{background:#a23e45}\n.ol-coverage-segment.center{background:#aeb5bd}\n.ol-coverage-segment.right{background:#386ba9}\n.ol-coverage-stripe.empty{background:repeating-linear-gradient(120deg,#e7ede9 0,#e7ede9 12px,#f1f5f2 12px,#f1f5f2 24px)}\n.ol-coverage-key{display:flex;justify-content:space-between;gap:7px;flex-wrap:wrap}\n.ol-coverage-key span{font-size:10px;font-weight:750;color:#607870}\n.ol-coverage-key .left{color:#a23e45}.ol-coverage-key .center{color:#61727e}.ol-coverage-key .right{color:#386ba9}\n.ol-coverage-caveat{font-size:10px;line-height:1.5;color:#7a8c81}\n.ol-coverage-caveat strong{font-weight:780;color:#566d62}\n.ol-coverage-reader{margin:16px 0;max-width:570px}\n.ol-coverage-reader .ol-coverage-stripe{height:19px}\n.ol-reader-hero>.ol-card-cover{height:275px;margin:18px 0 15px}\n.ol-reader-hero>.ol-card-cover .ol-cover-caption{left:15px;bottom:15px}\n.ol-feed-card .ol-feed-description{display:none}\n.ol-feed-card .ol-feed-source-list{margin-top:2px}\n.ol-feed-featured .ol-feed-description{display:block}\n.ol-feed-featured{grid-column:span 2}\n.ol-topic-hub{margin:12px 0 17px;border:1px solid #dfe9e2;background:#fff;border-radius:14px;padding:14px 15px}\n.ol-topic-hub-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px}\n.ol-topic-hub-top strong{font-size:12px;color:#375b4e}\n.ol-topic-hub-top span{font-size:10px;color:#7a9082}\n.ol-topic-groups{display:flex;gap:7px;overflow-x:auto;scrollbar-width:thin;padding-bottom:8px}\n.ol-topic-group{background:#f5f8f5;border:1px solid #dce9e0;color:#466c5c;border-radius:8px;padding:9px 12px;min-height:38px;white-space:nowrap;font-size:11px;font-weight:770;cursor:pointer}\n.ol-topic-group[aria-pressed=\"true\"]{background:#193d43;color:#fff;border-color:#193d43}\n.ol-topic-choices{border-top:1px solid #edf1ed;padding-top:10px;display:flex;flex-wrap:wrap;gap:7px}\n.ol-topic-choice{background:#fff;border:1px solid #dce7de;color:#587569;font-size:11px;font-weight:700;border-radius:18px;padding:7px 11px;cursor:pointer}\n.ol-topic-choice.active,.ol-topic-choice[aria-pressed=\"true\"]{background:#e5f5ec;border-color:#a7d5bb;color:#0a745c}\n.ol-spot-teaser{display:flex;align-items:center;justify-content:space-between;gap:15px;background:#eff7f1;border:1px solid #d8e8dc;border-radius:12px;padding:12px 16px;margin:10px 0}\n.ol-spot-teaser strong{font-size:12px;color:#275545}\n.ol-spot-teaser p{font-size:11px;color:#658275;line-height:1.6;margin:3px 0 0}\n.ol-spot-teaser button{border:1px solid #c3dfcd;border-radius:9px;background:white;color:#0e775e;padding:8px 12px;min-height:36px;white-space:nowrap;cursor:pointer;font-weight:750;font-size:11px}\n.ol-spots-page{max-width:1210px;margin:0 auto}\n.ol-spots-hero{background:#fff;border:1px solid #e0e9e2;border-radius:18px;padding:27px 30px}\n.ol-spots-eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.14em;color:#087b66;font-weight:800}\n.ol-spots-hero h1{font-family:Georgia,\"Times New Roman\",serif;font-size:36px;margin:9px 0;color:#173941}\n.ol-spots-hero p{font-size:12px;color:#698176;max-width:820px;line-height:1.75}\n.ol-spots-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:13px 0}\n.ol-spots-metrics>div{padding:15px 17px;background:#fff;border:1px solid #e0e9e2;border-radius:12px}\n.ol-spots-metrics strong{display:block;font-size:24px;color:#245b4c}\n.ol-spots-metrics span{font-size:11px;color:#778b7d}\n.ol-spots-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:17px 0 12px}\n.ol-spots-tabs button{padding:10px 12px;border-radius:9px;border:1px solid #dbe7df;background:#fff;color:#55766a;cursor:pointer;font-size:11px;font-weight:770}\n.ol-spots-tabs button[aria-pressed=\"true\"]{background:#1c4146;color:#fff;border-color:#1c4146}\n.ol-spots-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}\n.ol-spot-item{background:#fff;border:1px solid #e0e8e1;border-radius:12px;padding:17px;display:grid;gap:8px}\n.ol-spot-item-top{display:flex;justify-content:space-between;gap:10px}\n.ol-spot-item-type{font-size:10px;font-weight:780;color:#916b29;background:#fcf4e7;padding:6px 8px;border-radius:7px}\n.ol-spot-item h3{font-size:15px;line-height:1.4;margin:2px 0;color:#25453f}\n.ol-spot-item p{font-size:11px;color:#728779;line-height:1.6;margin:0}\n.ol-spot-item .ol-card-cover{height:150px;margin:0 0 7px}\n.ol-spot-item button{justify-self:start;cursor:pointer;padding:9px 11px;border:1px solid #cee4d7;background:#f1f8f3;color:#0b7764;font-size:11px;font-weight:780;border-radius:8px}\n.ol-spot-empty{grid-column:1/-1;border:1px dashed #dae9dd;background:#fff;border-radius:12px;text-align:center;padding:40px 20px}\n.ol-spot-empty h3{color:#315748;font-size:18px}\n.ol-spot-empty p{color:#73877c;font-size:12px}\n.ol-spot-method{padding:14px 18px;margin:14px 0 0;background:#f0f7f1;border:1px solid #dceadd;border-radius:12px;color:#607c6a;font-size:11px;line-height:1.75}\n.ol-theme-toggle{display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid #d7e8dd;border-radius:9px;background:#f7faf7;color:#295a4b;min-width:39px;min-height:39px;padding:8px 10px;cursor:pointer;font-weight:780;font-size:11px;white-space:nowrap}\n.ol-theme-toggle:hover{background:#e8f3ed}\n.ol-theme-toggle svg{height:16px;width:16px;flex:none}\n.ol-theme-toggle.mobile{display:none}\nhtml[data-ol-theme=\"dark\"]{color-scheme:dark;--ink:#e4edec;--ink2:#c3d4d0;--muted:#a3b4af;--line:#2b4149;--paper:#192934;--canvas:#0e1921;--ol-bg:#101b24;--ol-deep:#e5f0ef;--ol-line:#30414c;--ol-accent:#8dd9bd;--blue:#9bc8ee;--green:#9bd9bc}\nhtml[data-ol-theme=\"dark\"] body.ol-refresh{background:#0d1821!important;color:#d9e7e5!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(.sidebar,.topbar,.intro,.stat,.panel,.bias-panel,.filterbar,.ol-newsroom-hero,.ol-feed-card,.ol-reader-hero,.ol-reader-headlines,.ol-reader-method,.ol-dir-hero,.ol-dir-panel,.ol-dir-stats>div,.ol-watch-hero,.ol-watch-panel,.ol-watch-stat,.ol-watch-card,.ol-spots-hero,.ol-spots-metrics>div,.ol-spot-item,.ol-topic-hub,.ol-sample-disclosure,.ol-spot-empty,.ol-official-panel,.ol-official-event,.ol-quick-panel,.ol-review-box,.ol-review-metric,.ol-detail-tabs,.ol-extra-filters,.ol-dir-row,.ol-dir-explain,.ol-spot-teaser){background:#172832!important;border-color:#30454a!important;color:#e0eeeb!important;box-shadow:none!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(.content,.app,.story-list,.detail,.ol-newsroom,.ol-reader,.ol-spots-page,.ol-dir-page,.ol-watch-page){background:transparent!important;color:#d9e8e3!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(h1,h2,h3,h4,h5,.ol-feed-title,.ol-feed-category,.ol-newsroom-hero h1,.ol-reader-hero h1,.ol-dir-hero h1,.ol-spots-hero h1,.ol-directory-header h1,.stat-value,.ol-watch-stat strong,.ol-spot-item h3,.ol-review-title h1,.ol-dir-stats strong,.ol-spots-metrics strong,.ol-coverage-key span,.ol-spot-teaser strong,.brand){color:#e7f1ee!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(p,.subtle,.ol-feed-source-list,.ol-feed-meta,.ol-feed-time,.ol-coverage-caveat,.ol-reader-metadata,.ol-newsroom-count,.ol-spots-hero p,.ol-spot-item p,.ol-dir-hero p,.ol-watch-meta,.ol-official-event p,.ol-review-muted,.ol-spot-teaser p){color:#adbfba!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(input,select,textarea,.search-box,.ol-topic-group,.ol-topic-choice,.ol-feed-cta,.ol-feed-save,.btn.ghost,.ol-dir-button,.ol-theme-toggle,.ol-spots-tabs button,.ol-spot-item button,.ol-review-btn,.ol-watch-btn,.ol-official-button,.ol-spot-teaser button,.ol-directory-cta,.ol-dir-filters button){background:#223741!important;color:#d8e7e3!important;border-color:#38525b!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(.nav-btn.active,.ol-topic-group[aria-pressed=\"true\"],.ol-spots-tabs button[aria-pressed=\"true\"],.ol-dir-filters button[aria-pressed=\"true\"]){background:#215448!important;color:#dcfff0!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(.ol-cover-caption,.ol-cover-fallback){color:#f1fff8!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(.ol-topic-choices,.ol-feed-line,.ol-reader-metadata,.ol-spot-item,.ol-dir-row,.ol-official-event,.ol-sample-disclosure){border-color:#30454a!important}\nhtml[data-ol-theme=\"dark\"] .ol-coverage-stripe.empty{background:repeating-linear-gradient(120deg,#253844 0,#253844 12px,#30434b 12px,#30434b 24px)!important}\nhtml[data-ol-theme=\"dark\"] .ol-coverage-key .left{color:#f2a4ab!important}html[data-ol-theme=\"dark\"] .ol-coverage-key .right{color:#9cc4f3!important}html[data-ol-theme=\"dark\"] .ol-coverage-key .center{color:#c9d1d7!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh .ol-feed-card.ol-feed-featured{background:linear-gradient(145deg,#1c333c,#152833)!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh .ol-card-cover{background:linear-gradient(120deg,#203d47,#225b52)!important}\nhtml[data-ol-theme=\"dark\"] .ol-refresh .ol-spot-item-type{color:#e6c78a;background:#4b3b27}\nhtml[data-ol-theme=\"dark\"] .ol-refresh :is(.ol-bias-legend-item,.ol-dir-badge,.ol-official-pill,.ol-spot-item-type){border-color:#41504e}\nhtml[data-ol-theme=\"dark\"] .ol-refresh .ol-feed-cta:hover{background:#2d544e!important}\n@media(max-width:850px){.ol-theme-toggle.desktop{display:none}.ol-theme-toggle.mobile{display:flex;flex:none;padding:8px;min-width:36px;min-height:36px}.ol-topic-groups{flex-wrap:nowrap}.ol-spots-grid{grid-template-columns:1fr}}\n@media(max-width:650px){.ol-feed-featured .ol-card-cover{height:220px}.ol-card-cover{height:165px}.ol-spots-hero{padding:20px}.ol-spots-hero h1{font-size:29px}.ol-spots-metrics{gap:6px}.ol-spots-metrics>div{padding:11px}.ol-spots-metrics strong{font-size:20px}.ol-spots-tabs button{padding:9px}.ol-spots-grid{grid-template-columns:1fr}.ol-topic-hub{padding:11px}.ol-spot-teaser{flex-direction:column;align-items:flex-start}.ol-spots-hero p{font-size:12px}}\n@media(prefers-reduced-motion:reduce){.ol-card-cover img{transition:none}}\n";document.head.append(styles);
const topicGroups=[
 {key:'overview',label:'Uitgelicht',topics:[['all','Alle berichten'],['netherlands','Nederland'],['dutch-politics','Den Haag'],['eu-policy','EU-beleid'],['housing','Wonen'],['migration','Migratie'],['public-finances','Belastingen'],['gaza','Gaza'],['ukraine','Oekraïne']]},
 {key:'nl',label:'Nederland',topics:[['netherlands','Nederland'],['dutch-politics','Nationale politiek'],['local-government','Gemeenten & provincies'],['housing','Woningmarkt'],['public-finances','Rijksbegroting'],['rule-of-law','Rechtsstaat'],['belgium-benelux','Benelux']]},
 {key:'eu',label:'Europese Unie',topics:[['europe','Europees nieuws'],['eu-policy','EU-regels & beleid'],['eu-institutions','EU-instellingen'],['migration','Migratie & asiel'],['digital-policy','Digitale regelgeving'],['security-defense','Veiligheid']]},
 {key:'economy',label:'Economie & beleid',topics:[['business','Economie'],['public-finances','Financiën'],['labor','Arbeidsmarkt'],['agriculture','Landbouw & stikstof'],['climate-energy','Energietransitie'],['mobility','Mobiliteit']]},
 {key:'society',label:'Samenleving',topics:[['healthcare-nl','Zorg'],['health','Gezondheid'],['education','Onderwijs'],['social-policy','Sociale zekerheid'],['climate','Klimaat'],['technology','Technologie'],['digital-policy','AI & overheid']]},
 {key:'world',label:'Internationaal',topics:[['world','Wereld'],['politics','Politiek wereldwijd'],['geopolitics','Geopolitiek'],['gaza','Gaza'],['ukraine','Oekraïne'],['middle-east','Midden-Oosten'],['security-defense','Defensie']]}
];
let category='overview',blindFilter='overview',photoRequests=0;
const photos=new Map(),pending=new Map(),queue=[];let activeFetches=0;
let theme='light';
try{const v=localStorage.getItem(THEME);theme=['light','dark'].includes(v)?v:(window.matchMedia?.('(prefers-color-scheme: dark)')?.matches?'dark':'light')}catch{}
function setTheme(next){
 theme=next==='dark'?'dark':'light';
 document.documentElement.dataset.olTheme=theme;
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#0d1821':'#17313D');
 document.querySelectorAll('[data-ol-theme-toggle]').forEach(b=>{
  b.setAttribute('aria-label',theme==='dark'?'Schakel naar lichte modus':'Schakel naar donkere modus');
  b.setAttribute('aria-pressed',String(theme==='dark'));
  b.innerHTML=(theme==='dark'?'☀︎':'☾')+' <span>'+ (theme==='dark'?'Licht':'Donker')+'</span>';
 });
 try{localStorage.setItem(THEME,theme)}catch{}
}
function themeButtons(){
 const top=document.querySelector('.top-right'),sidebar=document.querySelector('.sidebar');
 for(const [container,size] of [[top,'desktop'],[sidebar,'mobile']]){
  if(!container||container.querySelector('[data-ol-theme-toggle]'))continue;
  const b=document.createElement('button');b.type='button';b.className='ol-theme-toggle '+size;
  b.dataset.olThemeToggle='';container.append(b);
 }
 setTheme(theme);
}
function navigation(){
 const nav=document.querySelector('.sidebar nav'),p=nav?.querySelector('[data-view="publishers"]');
 if(!nav||!p||nav.querySelector('[data-view="blindspots"]'))return;
 const button=document.createElement('button');button.className='nav-btn';button.type='button';
 button.dataset.view='blindspots';button.title='Mogelijke perspectief- en classificatiegaten in de actuele steekproef';
 button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Zm0 6v5m0 3h.01"/></svg> Blinde vlekken';
 p.after(button);
}
function metricsFor(story){
 const articles=filteredArticles(story);
 return metrics.summarize(articles,a=>sourceInfo(a).name,n=>window.OpenLensPublisherRatingLookup?.(n));
}
function bar(m,extra=''){
 const n=m.rated,all=m.total,s=m.shares,c=m.counts;
 const segment=(side)=>s[side]>0?'<span class="ol-coverage-segment '+side+'" style="width:'+s[side]+'%"></span>':'';
 const desc=n?('Links '+s.left+'%, midden '+s.center+'%, rechts '+s.right+'% van '+n+' geclassificeerde uitgevers. '+(c.unrated||0)+' ongeclassificeerd, '+(c.other||0)+' institutioneel of anders.'):
  'Geen uitgevers met een geschikte politieke classificatie gevonden';
 return '<div class="ol-coverage-unit '+extra+'" aria-label="Politieke bronverdeling in deze steekproef">'+
 '<div role="img" class="ol-coverage-stripe'+(n?'':' empty')+'" aria-label="'+escaped(desc)+'">'+
 (n?segment('left')+segment('center')+segment('right'):'')+'</div>'+
 '<div class="ol-coverage-key">'+
 (n?'<span class="left">Links '+s.left+'%</span><span class="center">Midden '+s.center+'%</span><span class="right">Rechts '+s.right+'%</span>':
 '<span>Geen beoordeelde bronnen</span>')+'</div>'+
 '<div class="ol-coverage-caveat"><strong>'+n+' van '+all+' uitgevers</strong> politiek beoordeeld'+
 (c.unrated?' · '+c.unrated+' niet ingeschaald':'')+(c.other?' · '+c.other+' overige bronnen':'')+'</div></div>';
}
const validPhoto=s=>{try{const u=new URL(String(s));return u.protocol==='https:'&&u.hostname.includes('.')&&!u.username&&!u.password&&!/(^|\.)(localhost|local|internal)$/i.test(u.hostname)&&u.href.length<1700}catch{return false}};
function cover(story,cssClass=''){
 const el=document.createElement('div');el.className='ol-card-cover '+cssClass;
 el.innerHTML='<div class="ol-cover-fallback">OPENLENS · REDACTIE</div><span class="ol-cover-caption">Bronbeeld controleren…</span>';
 el.dataset.olPhotoStory=story.id;
 return el;
}
function setPhoto(element,record,ready=true){
 if(!element?.isConnected)return;
 const label=element.querySelector('.ol-cover-caption');
 if(!record||!validPhoto(record.url)){
  if(label)label.textContent='Geen bronafbeelding beschikbaar';
  return;
 }
 const picture=document.createElement('img');picture.loading='lazy';picture.decoding='async';
 picture.alt='Afbeelding uit metadata van '+record.source;
 picture.referrerPolicy='no-referrer';
 picture.addEventListener('load',()=>{
  element.classList.add('has-photo');
  if(label)label.textContent='Beeld: '+record.source+' · metadata uitgever';
 });
 picture.addEventListener('error',()=>{
  picture.remove();element.classList.remove('has-photo');
  if(label)label.textContent='Bronbeeld niet beschikbaar';
 });
 picture.src=record.url;element.prepend(picture);
}
function tryPhotoForStory(story,element){
 if(story.demo){setPhoto(element,null);return}
 const articles=filteredArticles(story);
 for(const a of articles){
  if(validPhoto(a.imageUrl)){setPhoto(element,{url:a.imageUrl,source:sourceInfo(a).name});return}
 }
 const urls=articles.filter(a=>/^https:\/\//i.test(a.url||'')).slice(0,3);
 if(!urls.length){setPhoto(element,null);return}
 const key=urls.map(a=>a.url).slice(0,2).join('|');
 if(photos.has(key)){setPhoto(element,photos.get(key));return}
 const apply=record=>{if(element.isConnected)setPhoto(element,record)};
 if(pending.has(key)){pending.get(key).then(apply);return}
 if(photoRequests>=CAP){setPhoto(element,null);return}
 photoRequests++;
 const task=new Promise(resolve=>queue.push({urls:urls.slice(0,2),resolve}));pending.set(key,task);
 task.then(record=>{pending.delete(key);photos.set(key,record);apply(record)});
 pump();
}
function pump(){
 while(activeFetches<3&&queue.length){
  const task=queue.shift();activeFetches++;
  (async()=>{
   let found=null;
   for(const article of task.urls){
    try{
     const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),11000);
     let response;
     try{response=await fetch('/api/article-preview?'+new URLSearchParams({url:article.url,visual:'20261110v2'}),{signal:ctl.signal,headers:{Accept:'application/json'}})}
     finally{clearTimeout(timer)}
     if(!response.ok)continue;
     const data=await response.json();
     if(validPhoto(data.imageUrl)){found={url:data.imageUrl,source:sourceInfo(article).name};break}
    }catch{}
   }
   task.resolve(found);
  })().finally(()=>{activeFetches--;pump()});
 }
}
let observer;
function observeCover(story,element){
 if(story.demo){setPhoto(element,null);return}
 if(typeof IntersectionObserver==='undefined'){tryPhotoForStory(story,element);return}
 if(!observer)observer=new IntersectionObserver(entries=>{
  for(const entry of entries)if(entry.isIntersecting){
   observer.unobserve(entry.target);
   const id=entry.target.dataset.olPhotoStory,story=state.stories.find(x=>x.id===id);
   if(story)tryPhotoForStory(story,entry.target);
  }
 },{rootMargin:'300px 0px'});
 observer.observe(element);
}
function addMediaAndBars(){
 if(state.view!=='dashboard')return;
 const stories=new Map(filterStories().map(s=>[s.id,s]));
 for(const card of document.querySelectorAll('.ol-feed-card')){
  const id=card.querySelector('[data-ol-open-story]')?.dataset.olOpenStory,story=stories.get(id);
  if(!story)continue;
  if(!card.querySelector('.ol-card-cover')){
   const artwork=cover(story);card.prepend(artwork);observeCover(story,artwork);
  }
  if(!card.querySelector('.ol-coverage-unit')){
   const item=document.createElement('div');item.innerHTML=bar(metricsFor(story));
   card.querySelector('.ol-feed-source-list')?.after(item.firstElementChild);
  }
 }
 const reader=document.querySelector('.ol-reader'),id=state.selected,story=stories.get(id);
 if(reader&&story){
  const hero=reader.querySelector('.ol-reader-hero'),title=hero?.querySelector('h1');
  if(hero&&!hero.querySelector('.ol-card-cover')){
   const artwork=cover(story);title?.after(artwork);observeCover(story,artwork);
  }
  if(hero&&!hero.querySelector('.ol-coverage-reader')){
   const wrap=document.createElement('div');wrap.innerHTML=bar(metricsFor(story),'ol-coverage-reader');
   hero.querySelector('.ol-reader-lead')?.after(wrap.firstElementChild);
  }
 }
}
function topicGroupUI(){
 if(state.view!=='dashboard')return;
 document.querySelector('.ol-topic-rail')?.remove();
 const filter=document.querySelector('.filterbar');if(!filter)return;
 if(state.topic!=='all'&&!topicGroups.find(g=>g.key===category)?.topics.some(x=>x[0]===state.topic)){
  category=topicGroups.find(g=>g.key!=='overview'&&g.topics.some(x=>x[0]===state.topic))?.key||'overview';
 }
 const chosen=topicGroups.find(g=>g.key===category)||topicGroups[0];
 const existing=document.querySelector('.ol-topic-hub');if(existing)existing.remove();
 const hub=document.createElement('section');hub.className='ol-topic-hub';
 const categories=topicGroups.map(g=>'<button type="button" class="ol-topic-group" data-ol-topic-group="'+g.key+
 '" aria-pressed="'+(category===g.key)+'">'+escaped(g.label)+'</button>').join('');
 const chips=chosen.topics.map(([id,title])=>'<button type="button" class="ol-topic-choice'+(state.topic===id?' active':'')+
 '" data-ol-topic-choice="'+id+'" aria-pressed="'+(state.topic===id)+'">'+escaped(title)+'</button>').join('');
 hub.innerHTML='<div class="ol-topic-hub-top"><strong>Ontdek per onderwerp</strong><span>Maak een keuze om live bronnen te vergelijken</span></div>'+
 '<div class="ol-topic-groups" role="group" aria-label="Onderwerpgroepen">'+categories+'</div>'+
 '<div class="ol-topic-choices" role="group" aria-label="Onderwerpen">'+chips+'</div>';
 filter.before(hub);
}
function auditReport(){
 return window.OpenLensBlindspotAudit.analyze(
  filterStories(),s=>filteredArticles(s),a=>sourceInfo(a).name,
  n=>window.OpenLensPublisherRatingLookup?.(n)||{},
  n=>window.OpenLensSourceAudit?.lookup(n)||{},
  metrics,n=>window.OpenLensPublisherOrientationLookup?.(n)||null
 );
}
function topicSelectionSummary(data){
 const chosen=state.topic==='all'?'Alle onderwerpen':state.topic;
 return 'Huidige nieuwsselectie: '+escaped(chosen)+' · '+data.metrics.stories+' verhaalclusters · '+data.metrics.articles+
 ' artikelen. Koppen zijn automatisch en voorlopig gegroepeerd.';
}
function spotCard(x,showBias){
 const s=x.story,m=x.summary;
 const sourceNames=m.sources.map(s=>s.name).slice(0,4).map(escaped).join(' · ');
 return '<article class="ol-spot-item"><div class="ol-spot-item-top"><span class="ol-spot-item-type">'+
 (showBias?'Mogelijk perspectiefgat':'Meerdere nieuwsbronnen')+'</span><span class="ol-feed-time">'+
 escaped(s.topic||'Nieuws')+'</span></div><h3>'+escaped(s.title)+'</h3>'+
 '<p>'+m.total+' unieke uitgevers · '+x.articleCount+' artikelen · '+m.rated+
 ' met onderbouwde links-rechtsindeling</p>'+
 (showBias?bar(m):'')+'<p><strong>Bronnen:</strong> '+(sourceNames||'Niet geïdentificeerd')+'</p>'+
 '<button type="button" data-ol-spot-open="'+escaped(s.id)+'">Vergelijk originele berichten →</button></article>';
}
function auditRow(p){
 const identity=p.identityReviewed?(p.orientation?'Wel bronprofiel, niet op één links-rechts-as':'Bronsoort bekend, geen links-rechtsprofiel'):
  'Identiteit nader onderzoeken';
 const profile=p.orientationUrl?'<a class="ol-audit-link" rel="noopener noreferrer" target="_blank" href="'+escaped(p.orientationUrl)+'">Eurotopics: '+escaped(p.orientation||'profiel')+' ↗</a>':'';
 return '<article class="ol-audit-row"><div><strong>'+escaped(p.name)+'</strong><p>'+escaped(p.type)+
 ' · '+identity+'</p>'+(profile||'')+'</div><span class="ol-audit-count">'+p.articles+
 ' art. · '+p.stories+' verhalen</span></article>';
}
function auditPublisherPanels(data){
 const rated=data.metrics.classifiedEditorial,unrated=data.metrics.editorialWithoutRating;
 const total=rated+unrated,rows=data.unrated.slice(0,12).map(auditRow).join('');
 const unknown=data.unknown.slice(0,10).map(auditRow).join('');
 return '<div class="ol-audit-grid"><section class="ol-spots-primary"><h2>Wel bekend, geen politieke score</h2>'+
 '<p>Deze '+unrated+' benoemde redactionele bronnen zijn herkend, maar hebben geen geschikt, gedocumenteerd links-rechtslabel. Dat betekent niet dat de uitgever onbetrouwbaar is. '+
 'Waar Eurotopics wel een profiel geeft, tonen we de oorspronkelijke term.</p>'+
 (rows||'<p>Geen ontbrekende redactionele beoordelingen.</p>')+
 '</section><section class="ol-spots-primary"><h2>Bronidentiteit nog niet gecontroleerd</h2>'+
 '<p>'+data.metrics.unknownIdentity+' naam/namen in deze selectie hebben extra identiteitsonderzoek nodig. '+
 'Officiële overheidsbronnen en andere institutionele publicaties worden apart gehouden ('+data.metrics.institutional+').</p>'+
 (unknown||'<div class="ol-spots-quiet"><strong>Geen openstaande identiteitssignalen</strong>Alle gevonden bronnamen in dit nieuwsmonster zijn reeds aan een bronsoort gekoppeld.</div>')+
 '</section></div><p class="ol-spots-status">'+total+' bekende redactionele uitgevers in de selectie; '+rated+
 ' met een onderbouwde links-rechtsindeling, '+unrated+' zonder zo’n score. '+data.metrics.orientationProfiles+
 ' uitgevers hebben een gedocumenteerd Eurotopics-profiel (ook als de oriëntatie niet op één as past).</p>'+
 '<button type="button" class="ol-spots-cta" data-view="publishers">Open volledige uitgeverslijst →</button>';
}
function blindspotView(){
 const data=auditReport();
 const eligible=data.candidates.slice(0,10),best=data.opportunities.slice(0,8),
  singles=data.singles.slice(0,6);
 const tab=blindFilter;
 const notice='<p class="ol-spots-status">'+topicSelectionSummary(data)+'</p>';
 const overview='<div class="ol-audit-grid"><section class="ol-spots-primary"><h2>Perspectiefonderzoek</h2>'+
 (eligible.length?'<p>'+eligible.length+' kandidaat-signaal/-signalen in dit nieuwsmonster. Geen bewezen omissie.</p>'+
 '<div class="ol-spots-grid">'+eligible.slice(0,3).map(x=>spotCard(x,true)).join('')+'</div>':
 '<div class="ol-spots-quiet"><strong>Geen overtuigende perspectiefsignalen</strong>De gevonden verhalen hebben nog niet genoeg onafhankelijk geclassificeerde uitgevers voor een zinvolle links-rechtsvergelijking. Dit is <strong>niet</strong> hetzelfde als geen blinde vlekken in de media.</div>')+
 '</section><section class="ol-spots-primary"><h2>Onderzoek waar de brondata tekortschieten</h2>'+
 '<p>Van '+data.metrics.uniquePublishers+' verschillende uitgevers zijn '+data.metrics.classifiedEditorial+
 ' redactionele uitgevers politiek ingeschaald. '+data.metrics.editorialWithoutRating+
 ' redactionele uitgevers hebben wel een herkende bronidentiteit, maar geen geschikte politieke score.</p>'+
 '<button class="ol-spots-cta" data-ol-spot-filter="sources">Onderzoek uitgevers en bronprofielen →</button></section></div>'+
 '<section class="ol-spots-primary"><h2>Verhalen met meerdere bronnen</h2>'+
 '<p>Handiger om te vergelijken dan tientallen berichten met één bron. Dit zijn vergelijkkansen, geen bewezen politieke blinde vlekken.</p>'+
 (best.length?'<div class="ol-spots-grid">'+best.slice(0,4).map(x=>spotCard(x,false)).join('')+'</div>':
 '<div class="ol-spots-quiet">Nog geen verhalen met meerdere gekoppelde uitgevers. Probeer een ander onderwerp of een ruimer datumbereik.</div>')+'</section>';
 const perspective='<section class="ol-spots-primary"><h2>Kandidaten voor politieke perspectiefgaten</h2>'+
 '<p>Alleen als minstens 3 uitgevers met een onderbouwde politieke beoordeling een verhaal delen, de beoordeling voldoende dekking heeft en één kant in het gevonden monster ontbreekt, verschijnt hier een kandidaat. Dit controleert geen artikelinhoud.</p>'+
 (eligible.length?'<div class="ol-spots-grid">'+eligible.map(x=>spotCard(x,true)).join('')+'</div>':
 '<div class="ol-spots-quiet"><strong>Geen voldoende onderbouwde kandidaten</strong>De meeste Nederlandse uitgevers hebben hier nog geen vergelijkbaar links-rechtsprofiel. Het systeem mag geen blindspot claimen op basis van één gekleurde bron.</div>')+'</section>';
 const comparable='<section class="ol-spots-primary"><h2>Vergelijk daadwerkelijk meerdere uitgevers</h2>'+
 '<p>'+data.metrics.comparable+' voorlopig gegroepeerde verhalen bevatten minstens twee uitgevers. Vergelijk de bronkoppen en lees de originele artikelen; titeloverlap is geen bewijs dat ze exact dezelfde gebeurtenis beschrijven.</p>'+
 (best.length?'<div class="ol-spots-grid">'+best.map(x=>spotCard(x,false)).join('')+'</div>':
 '<div class="ol-spots-quiet">Geen verhalen met minstens twee bronnen beschikbaar in de huidige selectie.</div>')+'</section>';
 const sampling='<section class="ol-spots-primary"><h2>Steekproefbeperkingen, niet automatisch blinde vlekken</h2>'+
 '<p>'+data.metrics.oneSource+' verhaalclusters hebben slechts één uitgever in de gevonden steekproef. Dat is doorgaans een limiet van nieuwsophaling of automatische kopgroepering en geen bewijs van negeren door andere redacties.</p>'+
 '<p>'+data.metrics.dataLimited+' clusters met meerdere bronnen hebben minder dan twee gedocumenteerde links-rechtsbeoordelingen.</p>'+
 (singles.length?'<div class="ol-spots-grid">'+singles.map(x=>spotCard(x,false)).join('')+'</div>':'')+'</section>';
 const body=tab==='perspective'?perspective:tab==='compare'?comparable:tab==='sources'?auditPublisherPanels(data):
 tab==='sampling'?sampling:overview;
 document.getElementById('content').innerHTML='<div class="ol-spots-page ol-spots-v2">'+
 '<header class="ol-spots-hero"><span class="ol-spots-eyebrow">OPENLENS · KRITISCH NIEUWSOVERZICHT</span>'+
 '<h1>Blinde vlekken & brononderzoek</h1>'+
 '<p>Niet elk ontbrekend politiek label is een blinde vlek. Hier zie je afzonderlijk <strong>mogelijke perspectiefgaten</strong>, '+
 '<strong>verhalen met meerdere bronnen</strong> en <strong>ontoereikende bronmetadata</strong>.'+
 ' OpenLens verzint geen politieke oriëntaties en concludeert nooit dat afwezigheid uit de zoekresultaten een bewuste omissie is.</p></header>'+
 '<div class="ol-spots-metrics"><div><strong>'+data.metrics.candidates+'</strong><span>Kandidaat-perspectiefgaten</span></div>'+
 '<div><strong>'+data.metrics.comparable+'</strong><span>Verhalen met meerdere bronnen</span></div>'+
 '<div><strong>'+data.metrics.editorialWithoutRating+'</strong><span>Redactioneel, zonder politieke score</span></div>'+
 '<div><strong>'+data.metrics.unknownIdentity+'</strong><span>Bronnamen nog niet geverifieerd</span></div></div>'+
 notice+'<nav class="ol-spots-tabs" aria-label="Analyseweergave">'+
 [['overview','Overzicht'],['perspective','Politieke perspectieven'],['compare','Vergelijkbare verhalen'],['sources','Uitgevers & profielen'],['sampling','Steekproefkwaliteit']].map(([k,v])=>
 '<button type="button" data-ol-spot-filter="'+k+'" aria-pressed="'+(tab===k)+'">'+v+'</button>').join('')+
 '</nav>'+body+
 '<p class="ol-spot-method"><strong>Methodiek:</strong> tellingen per unieke uitgever binnen de huidige onvolledige feed. '+
 'Eurotopics (redactionele oriëntatie) en AllSides (vooral Amerikaanse berichtgeving) hanteren verschillende methoden. '+
 'Alleen expliciete links-/rechtsbeschrijvingen worden grof gemapt; liberaal, christelijk en liberaal-conservatief worden apart vermeld. '+
 'Officiële instellingen, kenniscentra en aggregatoren krijgen geen politieke score. '+
 'Automatisch geclusterde artikelen zijn niet onafhankelijk op gelijkheid of weglatingen gecontroleerd.</p></div>';
 const crumb=document.getElementById('breadcrumb');if(crumb)crumb.textContent='Blinde vlekken';
}
function teaser(){
 if(state.view!=='dashboard'||!document.querySelector('.ol-newsroom'))return;
 const top=document.querySelector('.ol-newsroom-toolbar');if(!top||document.querySelector('.ol-spot-teaser'))return;
 const d=auditReport();
 const el=document.createElement('section');el.className='ol-spot-teaser';
 el.innerHTML='<div><strong>Blinde vlekken & brononderzoek</strong><p>'+d.metrics.candidates+
 ' mogelijke perspectiefgaten · '+d.metrics.comparable+' verhalen met meerdere uitgevers · '+d.metrics.editorialWithoutRating+
 ' bekende redacties zonder politieke score. Dit zijn verschillende soorten informatie.</p></div>'+
 '<button type="button" data-view="blindspots">Onderzoek de bronnen →</button>';
 top.before(el);
}
const oldRender=render;
render=function(){
 oldRender();navigation();themeButtons();
 if(state.view==='dashboard'){topicGroupUI();addMediaAndBars();teaser()}
 if(state.view==='blindspots')blindspotView();
 const nav=document.querySelector('[data-view="blindspots"]');
 if(nav)nav.classList.toggle('active',state.view==='blindspots');
};
document.addEventListener('click',e=>{
 const toggle=e.target.closest?.('[data-ol-theme-toggle]');
 if(toggle){e.preventDefault();e.stopImmediatePropagation();setTheme(theme==='dark'?'light':'dark');return}
 const group=e.target.closest?.('[data-ol-topic-group]');
 if(group){e.preventDefault();e.stopImmediatePropagation();category=group.dataset.olTopicGroup;topicGroupUI();return}
 const choice=e.target.closest?.('[data-ol-topic-choice]');
 if(choice){
  e.preventDefault();e.stopImmediatePropagation();
  const input=document.getElementById('topicFilter');
  if(input){input.value=choice.dataset.olTopicChoice;input.dispatchEvent(new Event('change',{bubbles:true}))}
  return
 }
 const tab=e.target.closest?.('[data-ol-spot-filter]');
 if(tab){e.preventDefault();e.stopImmediatePropagation();blindFilter=tab.dataset.olSpotFilter;render();return}
 const story=e.target.closest?.('[data-ol-spot-open]');
 if(story){e.preventDefault();e.stopImmediatePropagation();
  state.view='dashboard';render();window.OpenLensOpenStory?.(story.dataset.olSpotOpen);return}
},true);
setTheme(theme);render();
})();
