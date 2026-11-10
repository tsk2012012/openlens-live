/* OpenLens coverage perspectives extension, 2026-11-09.
   AllSides Media Bias Ratings™ by AllSides.com, CC BY-NC 4.0.
   Used with attribution for this noncommercial prototype.
   Ratings concern publisher-level online US political coverage, not an individual article's truth.
*/
(function () {
  'use strict';
  // Current profile categories checked 2026-11-10. Not an article-level truth evaluation.
  const ratings = Object.freeze({
    "reuters":{rating:"Center",confidence:"High",source:"https://www.allsides.com/news-source/reuters-media-bias"},
    "associated press":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/associated-press-media-bias"},
    "ap news":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/associated-press-media-bias"},
    "bbc":{rating:"Center",confidence:"Medium",source:"https://www.allsides.com/news-source/bbc-news-media-bias"},
    "bbc news":{rating:"Center",confidence:"Medium",source:"https://www.allsides.com/news-source/bbc-news-media-bias"},
    "the guardian":{rating:"Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/guardian-media-bias"},
    "guardian":{rating:"Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/guardian-media-bias"},
    "the new york times":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/new-york-times-news-media-bias"},
    "new york times":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/new-york-times-news-media-bias"},
    "npr":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/npr-media-bias"},
    "npr news":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/npr-media-bias"},
    "fox news":{rating:"Right",confidence:"Medium",source:"https://www.allsides.com/news-source/fox-news-media-bias"},
    "fox news digital":{rating:"Right",confidence:"Medium",source:"https://www.allsides.com/news-source/fox-news-media-bias"},
    "cnn":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/cnn-media-bias"},
    "cnn digital":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/cnn-media-bias"},
    "cnn com":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/cnn-media-bias"},
    "cnbc":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/cnbc-media-bias"},
    "nbc news":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/nbc-news-media-bias"},
    "nbc news digital":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/nbc-news-media-bias"},
    "the hill":{rating:"Center",confidence:"High",source:"https://www.allsides.com/news-source/hill-media-bias"},
    "politico":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/politico-media-bias"},
    "axios":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/axios-media-bias"},
    "bloomberg":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/bloomberg-media-bias"},
    "bloomberg com":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/bloomberg-media-bias"},
    "bloomberg news":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/bloomberg-media-bias"},
    "forbes":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/forbes-media-bias"},
    "al jazeera":{rating:"Lean Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/al-jazeera-media-bias"},
    "al jazeera english":{rating:"Lean Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/al-jazeera-media-bias"},
    "the economist":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/economist-media-bias"},
    "economist":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/economist-media-bias"},
    "time":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/time-magazine-news-media-bias"},
    "time magazine":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/time-magazine-news-media-bias"},
    "usa today":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/usa-today-media-bias"},
    "pbs newshour":{rating:"Lean Left",confidence:"Medium",source:"https://www.allsides.com/news-source/pbs-newshour-media-bias"},
    "abc news":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/abc-news-media-bias"},
    "cbs news":{rating:"Lean Left",confidence:"High",source:"https://www.allsides.com/news-source/cbs-news-online-media-bias"},
    "the daily wire":{rating:"Right",confidence:"High",source:"https://www.allsides.com/news-source/daily-wire-media-bias"},
    "daily wire":{rating:"Right",confidence:"High",source:"https://www.allsides.com/news-source/daily-wire-media-bias"},
    "dailywire":{rating:"Right",confidence:"High",source:"https://www.allsides.com/news-source/daily-wire-media-bias"},
    "breitbart":{rating:"Right",confidence:"Low / initial",source:"https://www.allsides.com/news-source/breitbart-news-media-bias"},
    "breitbart news":{rating:"Right",confidence:"Low / initial",source:"https://www.allsides.com/news-source/breitbart-news-media-bias"},
    "the federalist":{rating:"Right",confidence:"High",source:"https://www.allsides.com/news-source/federalist-media-bias"},
    "new york post":{rating:"Right",confidence:"Medium",source:"https://www.allsides.com/news-source/new-york-post-news-media-bias"},
    "ny post":{rating:"Right",confidence:"Medium",source:"https://www.allsides.com/news-source/new-york-post-news-media-bias"},
    "new york post news":{rating:"Right",confidence:"Medium",source:"https://www.allsides.com/news-source/new-york-post-news-media-bias"},
    "newsmax":{rating:"Lean Right",confidence:"Low / initial",source:"https://www.allsides.com/news-source/newsmax"},
    "newsmax news":{rating:"Lean Right",confidence:"Low / initial",source:"https://www.allsides.com/news-source/newsmax"},
    "washington examiner":{rating:"Lean Right",confidence:"High",source:"https://www.allsides.com/news-source/washington-examiner-media-bias"},
    "the washington examiner":{rating:"Lean Right",confidence:"High",source:"https://www.allsides.com/news-source/washington-examiner-media-bias"},
    "washington times":{rating:"Lean Right",confidence:"Medium",source:"https://www.allsides.com/news-source/washington-times-media-bias"},
    "the washington times":{rating:"Lean Right",confidence:"Medium",source:"https://www.allsides.com/news-source/washington-times-media-bias"},
    "the dispatch":{rating:"Lean Right",confidence:"Medium",source:"https://www.allsides.com/news-source/dispatch-media-bias"},
    "national review":{rating:"Lean Right",confidence:"High",source:"https://www.allsides.com/news-source/national-review-news-media-bias"},
    "national review news":{rating:"Lean Right",confidence:"High",source:"https://www.allsides.com/news-source/national-review-news-media-bias"}
  });
  // 12 additional AllSides source profiles confirmed Nov 10, 2026; many have low-confidence assessments.
  const additionalRatings=Object.freeze({"alaska beacon":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/alaska-beacon-media-bias"},"the conversation":{rating:"Lean Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/conversation-media-bias"},"calmatters":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/calmatters-media-bias"},"idaho statesman":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/idaho-statesman-media-bias"},"al com":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/alcom-media-bias"},"the american prospect":{rating:"Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/american-prospect-media-bias"},"wfyi":{rating:"Lean Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/wfyi-media-bias"},"wisconsin watch":{rating:"Lean Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/wisconsin-watch-media-bias"},"kansas reflector":{rating:"Lean Left",confidence:"Low / initial",source:"https://www.allsides.com/news-source/kansas-reflector-media-bias"},"iowa public radio":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/iowa-public-radio-media-bias"},"the clarion ledger":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/clarion-ledger-media-bias"},"the jerusalem post":{rating:"Center",confidence:"Low / initial",source:"https://www.allsides.com/news-source/jerusalem-post-media-bias"}});
  const institutionalSources=Object.freeze({"league of minnesota cities":"Civic membership organization","washoe life gov":"Government communication","afge":"Labor organization","earthjustice":"Nonprofit advocacy organization","270towin com":"Election information website","multistate":"Public-affairs services","jefferson parish gov":"Government communication","the house of commons library":"Parliamentary research service","the trevor project":"Nonprofit organization"});
  const normalizePublisher=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const buckets=['Left','Lean Left','Center','Lean Right','Right','Unrated','Other source'];
  const hues={'Left':'#2464B8','Lean Left':'#79A7DE','Center':'#8994A6','Lean Right':'#EB9A9B','Right':'#C94D59','Unrated':'#E0E4EB','Other source':'#D7D4CB'};
  const modes={all:'All leanings',left:'Left / Lean Left',center:'Center',right:'Right / Lean Right',unrated:'Unrated media',other:'Institutional / other'};
  let biasFilter='all';
  const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rated=name=>{
    const key=normalizePublisher(name),audited=window.OpenLensSourceAudit?.lookup(name),known=audited?.rating?{rating:audited.rating,confidence:audited.confidence,source:audited.source}:ratings[key]||additionalRatings[key];
    if(known)return known;
    if(audited&&!audited.politicallyAssessable)return {rating:'Other source',confidence:'Not applicable',source:null,reason:audited.type};
    if(institutionalSources[key])return {rating:'Other source',confidence:'Not applicable',source:null,reason:institutionalSources[key]};
    return {rating:'Unrated',confidence:'Not assessed',source:null};
  };
  window.OpenLensPublisherRatingLookup=Object.freeze(rated);
  const groupMatches=r=>biasFilter==='all'||(biasFilter==='left'&&['Left','Lean Left'].includes(r))||(biasFilter==='right'&&['Right','Lean Right'].includes(r))||(biasFilter==='center'&&r==='Center')||(biasFilter==='unrated'&&r==='Unrated')||(biasFilter==='other'&&r==='Other source');
  const uniqueSources=articles=>[...new Set(articles.map(a=>sourceInfo(a).name))];
  const counts=articles=>{const out=Object.fromEntries(buckets.map(n=>[n,0]));uniqueSources(articles).forEach(n=>out[rated(n).rating]++);return out};
  const legend=out=>buckets.map(n=>`<span class="bias-legend-item"><i style="background:${hues[n]}"></i>${escapeHTML(n)} <strong>${out[n]||0}</strong></span>`).join('');
  const segments=out=>{let total=Object.values(out).reduce((a,b)=>a+b,0);if(!total)return '<div class="bias-strip empty-strip"></div>';return `<div class="bias-strip" role="img" aria-label="Publisher distribution: ${buckets.map(b=>`${b} ${out[b]}`).join(', ')}">${buckets.filter(b=>out[b]).map(b=>`<span style="background:${hues[b]};width:${out[b]/total*100}%" title="${b}: ${out[b]} of ${total} distinct publishers"></span>`).join('')}</div>`};
  const badge=name=>{let r=rated(name);return `<span class="bias-pill" style="--bias-tone:${hues[r.rating]}" title="${escapeHTML(r.source?`AllSides: ${r.rating} • ${r.confidence} confidence • rating applies mainly to online US political coverage` :r.reason?('Source type: '+r.reason+'. Political outlet bias is not applicable.'): 'No checked rating available')}">${escapeHTML(r.rating)}</span>`};
  const css=`
.bias-panel{background:#fff;border:1px solid var(--line);border-radius:14px;padding:17px 20px;margin:0 0 14px;box-shadow:var(--shadow)}
.bias-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.bias-panel h3{font-size:14px;margin:0;font-weight:800;color:#263650}
.bias-panel small{font-size:11px;color:#79869e}
.bias-strip{display:flex;width:100%;height:13px;overflow:hidden;border-radius:8px;gap:0;margin:12px 0 9px;background:#eef1f5}
.bias-strip span{height:100%;min-width:2px;display:block}
.bias-strip.empty-strip{height:13px}
.bias-strip.compact{height:5px;margin:8px 0 0}
.bias-legend{display:flex;gap:10px 14px;flex-wrap:wrap;margin:8px 0}
.bias-legend-item{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#56677e}
.bias-legend-item i{width:9px;height:9px;border-radius:2px;display:inline-block}
.bias-legend-item strong{font-size:11px;color:#24324b}
.bias-pill{border-left:3px solid var(--bias-tone);background:#f7f8fb;border-radius:5px;padding:3px 7px;font-size:10px;font-weight:780;color:#35435c;display:inline-flex;white-space:nowrap;align-items:center;line-height:1.5}
.bias-card-add{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:9px}
.bias-method{font-size:10px;color:#8795aa;line-height:1.55;margin:6px 0 0}
.bias-method a{color:#355cda;text-decoration:underline}
.bias-links{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}
.bias-outlet-badge{margin-left:5px}
.omission-summary{border:1px solid #e9edf4;background:#f8fafd;border-radius:9px;padding:12px;margin:12px 0}
.omission-stat{font-size:11px;color:#485a77;margin-top:8px;display:flex;flex-wrap:wrap;gap:7px;align-items:center}
.omission-stat strong{color:#35435c}
@media(max-width:600px){.bias-panel{padding:13px}.bias-panel-head{align-items:start}.bias-legend{gap:8px 12px}.bias-legend-item{font-size:10px}}
`;
  const style=document.createElement('style');style.textContent=".bias-audit-details{margin-top:13px;border-top:1px solid #e5ebe6;padding-top:11px}.bias-audit-details>summary{font-size:12px;font-weight:760;cursor:pointer;color:#2c6552}.bias-audit-list{max-height:370px;overflow:auto;margin-top:9px;border:1px solid #e4ece5;border-radius:9px}.bias-audit-entry{display:grid;grid-template-columns:minmax(100px,1.25fr) minmax(95px,1fr) minmax(90px,.8fr) auto;gap:8px;padding:9px 10px;font-size:11px;border-bottom:1px solid #e9eee8;align-items:center}.bias-audit-entry strong{color:#2d4c40;overflow-wrap:anywhere}.bias-audit-entry span{color:#697c71}.bias-audit-entry a{color:#097666}.bias-audit-entry:last-child{border-bottom:0}@media(max-width:600px){.bias-audit-entry{grid-template-columns:1fr 1fr;gap:4px}.bias-audit-entry strong{grid-column:1/-1}}"+css+".bias-related{border:1px solid #f2d8d9;background:#fffafa;border-radius:9px;padding:12px;margin-top:15px}.bias-related h3{margin:0 0 5px;font-size:12px;color:#853a42}.bias-related h3 small{font-weight:450;font-size:10px;color:#8590a3}.bias-related p,.bias-no-match{font-size:11px;line-height:1.55;color:#718099;margin:7px 0}.bias-related-row{display:flex;align-items:flex-start;flex-wrap:wrap;gap:6px;border-top:1px solid #f4e7e7;padding:9px 0}.bias-related-row a{font-weight:650;font-size:11px;flex:1 1 170px}.bias-related-row small{font-size:10px;color:#7c879d;flex-basis:100%}.bias-no-match{border:1px solid #e8edf4;background:#f7f9fe;border-radius:8px;padding:10px 12px;margin-top:15px}"+".bias-unknown-details{border-top:1px solid #e6eaf2;margin-top:12px;padding-top:10px}.bias-unknown-details summary{font-weight:730;color:#465774;font-size:11px;cursor:pointer}.bias-detail-list{font-size:11px;line-height:1.65;color:#60708b;margin:8px 0;overflow-wrap:anywhere}"+".bias-buttons{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.bias-buttons button{background:#fff;border:1px solid #dce2ef;border-radius:8px;padding:7px 10px;font-size:11px;color:#43526c;font-weight:700}.bias-buttons button.active,.bias-buttons button:hover{background:#eaf0ff;border-color:#9ab0f0;color:#234aca}.bias-overall{border-color:#dce5f8}.bias-overall .bias-method a{text-decoration:underline}";document.head.appendChild(style);
  if(typeof render!=='function'||typeof filteredArticles!=='function'){return}
  const originalFiltered=filteredArticles;
  filteredArticles=function(s){return originalFiltered(s).filter(a=>groupMatches(rated(sourceInfo(a).name).rating))};
  function reviewSummary(s,articles){
    const facts=state.facts.filter(f=>f.storyId===s.id),sources=uniqueSources(articles);
    let checks=0,notFound=0,found=0,contradicted=0,unclear=0;
    const byOutlet=[];
    for(const outlet of sources){let missing=0,reviewed=0;for(const fact of facts){const status=fact.review?.[outlet]?.status||'Not reviewed';if(status!=='Not reviewed'){checks++;reviewed++}if(status==='Not found after review'){notFound++;missing++}if(status==='Found in article')found++;if(status==='Contradicted in article')contradicted++;if(status==='Unclear / disputed')unclear++}if(reviewed)byOutlet.push(`${outlet}: ${missing}/${reviewed} not found`)}
    return `<div class="omission-summary"><strong style="font-size:12px">Reviewed evidence differences</strong><p class="bias-method">This summarizes <em>your manual article checks</em>, not automatically detected omissions. “Not found” means you did not locate a proposition after reading; it does not establish a deliberate omission.</p><div class="omission-stat"><span><strong>${checks}</strong> checks</span><span>·</span><span><strong>${found}</strong> found</span><span>·</span><span><strong>${notFound}</strong> not found</span><span>·</span><span><strong>${contradicted}</strong> contradicted</span><span>·</span><span><strong>${unclear}</strong> unclear</span></div>${byOutlet.length?`<p class="bias-method">${escapeHTML(byOutlet.join(' · '))}</p>`:'<p class="bias-method">To begin: add a specific proposition below, open original articles, then mark what you actually found.</p>'}</div>`;
  }
  function decorate(){
    if(state.view!=='dashboard')return;
    const filter=document.querySelector('.filterbar');
    if(filter&&!document.getElementById('biasFilter')){
      const select=document.createElement('select');select.className='filter';select.id='biasFilter';select.setAttribute('aria-label','Filter publishers by assessed political leaning');select.title='Publisher labels from AllSides; unrated outlets remain unknown';
      select.innerHTML=Object.entries(modes).map(([k,v])=>`<option value="${k}" ${k===biasFilter?'selected':''}>${escapeHTML(v)}</option>`).join('');filter.append(select);
    }
    const s=current();if(!s)return;
    const articles=filteredArticles(s),values=counts(articles),ratedN=uniqueSources(articles).length-values.Unrated-values['Other source'];
    const chart=document.createElement('section');chart.className='bias-panel';chart.setAttribute('aria-label','Political coverage distribution');chart.innerHTML=`<div class="bias-panel-head"><h3>Selected story · publisher leanings</h3><small>${uniqueSources(articles).length} distinct publisher${uniqueSources(articles).length===1?'':'s'} · ${ratedN} rated</small></div>${segments(values)}<div class="bias-legend">${legend(values)}</div><p class="bias-method">Shares reflect <strong>sampled publishers</strong> for the selected story, not total articles or public opinion. Ratings: <a href="https://www.allsides.com/media-bias" target="_blank" rel="noopener">AllSides Media Bias Ratings™</a>, checked Nov 10, 2026 (CC BY-NC 4.0). Primarily U.S. political news; an outlet rating does not classify or verify any particular article. Unrated sources stay visible.</p>`;

    const all=state.allArticles?.length?state.allArticles:state.stories.flatMap(s=>s.articles);
    const overall=counts(all),allNames=uniqueSources(all);
    const right=allNames.filter(n=>['Right','Lean Right'].includes(rated(n).rating));
    const rightLinks=right.slice(0,12).map(n=>'<a href="'+rated(n).source+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(n)+' ('+rated(n).rating+')</a>').join(' · ');
    const overallPanel=document.createElement('section');overallPanel.className='bias-panel bias-overall';
    overallPanel.innerHTML='<div class="bias-panel-head"><h3>Political perspectives · all news in sample</h3><small>'+allNames.length+' named sources · '+all.length+' articles</small></div>'+segments(overall)+'<div class="bias-legend">'+legend(overall)+'</div><div class="bias-buttons">'+[['all','All'],['left','Left / Lean Left'],['center','Center'],['right','Right / Lean Right'],['unrated','Unrated media'],['other','Institutional / other']].map(([key,label])=>'<button type="button" data-ol-lean="'+key+'" '+(biasFilter===key?'class="active"':'')+'>'+label+'</button>').join('')+'</div><p class="bias-method"><strong>Right-rated publishers:</strong> '+(rightLinks||'Not found in current sample. Try Politics and refresh.')+'</p><p class="bias-method">For US/English news, additional right-outlet searches are included beyond the general 100 headline search. These are NOT equal-weight samples of the media landscape. This displayed distribution is <strong>not representative</strong> of overall reporting. Ratings are publisher-level and never verify particular articles. <a href="https://www.allsides.com/media-bias" target="_blank" rel="noopener noreferrer">Rating methodology</a>.</p>';
    const unratedNames=allNames.filter(n=>rated(n).rating==='Unrated').sort();
    const otherNames=allNames.filter(n=>rated(n).rating==='Other source').sort();
    const reviewDetails=document.createElement('details');reviewDetails.className='bias-unknown-details';
    const summary=document.createElement('summary');summary.textContent='Why are some sources not rated? ('+unratedNames.length+' unrated media / unknown, '+otherNames.length+' other sources)';
    reviewDetails.append(summary);
    const p=document.createElement('p');p.className='bias-method';
    p.textContent='A source is not assigned a political leaning without a checked outlet-specific assessment. Government, civic and advocacy sources are shown separately. A parent brand’s rating is not automatically inherited by its local affiliate.';
    reviewDetails.append(p);
    if(unratedNames.length){const b=document.createElement('div');b.className='bias-detail-list';const strong=document.createElement('strong');strong.textContent='Unrated or unverified names: ';b.append(strong,document.createTextNode(unratedNames.join(' · ')));reviewDetails.append(b)}
    if(otherNames.length){const b=document.createElement('div');b.className='bias-detail-list';const strong=document.createElement('strong');strong.textContent='Non-news / institutional: ';b.append(strong,document.createTextNode(otherNames.map(n=>n+' — '+rated(n).reason).join(' · ')));reviewDetails.append(b)}
    overallPanel.append(reviewDetails);

    const audit=window.OpenLensSourceAudit;
    if(audit){
      const profiles=allNames.map(name=>({name,meta:audit.lookup(name),lean:rated(name)}));
      const recognized=profiles.filter(x=>x.meta.identityStatus==='Explicitly classified').length;
      const institutions=profiles.filter(x=>!x.meta.politicallyAssessable).length;
      const newsUnrated=profiles.filter(x=>x.meta.politicallyAssessable&&x.lean.rating==='Unrated').length;
      const unknown=profiles.filter(x=>x.meta.type==='Identity review needed').length;
      const details=document.createElement('details');details.className='bias-audit-details';
      const heading=document.createElement('summary');
      heading.textContent='Source audit · '+recognized+'/'+profiles.length+' identified · '+institutions+' institutional · '+newsUnrated+' without independent ratings';
      details.append(heading);
      const guide=document.createElement('p');guide.className='bias-method';
      guide.textContent='Each line separates source identity from political leaning. AllSides ratings reflect reviewed online reporting, not quality or truth. Organizations are classified by type, and uncertain identities remain unverified.';
      details.append(guide);
      const items=document.createElement('div');items.className='bias-audit-list';
      profiles.sort((a,b)=>a.name.localeCompare(b.name)).forEach(x=>{
        const line=document.createElement('div');line.className='bias-audit-entry';
        const name=document.createElement('strong');name.textContent=x.name;
        const kind=document.createElement('span');kind.textContent=x.meta.type;
        const rating=document.createElement('span');rating.textContent=x.lean.rating==='Unrated'?'Bias not assessed':x.lean.rating==='Other source'?'Not a news bias rating':x.lean.rating;
        line.append(name,kind,rating);
        if(x.lean.source){const a=document.createElement('a');a.href=x.lean.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Evidence ↗';line.append(a)}
        items.append(line);
      });
      details.append(items);
      overallPanel.append(details);
      const note=document.createElement('p');note.className='bias-method';
      note.textContent=unknown+' publisher identities still need individual verification. No political values were inferred from ownership, language, location or headlines.';
      overallPanel.append(note);
    }

    const bar=document.querySelector('.filterbar');if(bar)bar.before(overallPanel);

    const detailTop=document.querySelector('.detail-top');
    if(detailTop){
      const matching=all.filter(a=>/https?:\/\//.test(a.url||'')&&['Right','Lean Right'].includes(rated(sourceInfo(a).name).rating));
      const ownKeys=new Set(articles.map(a=>a.url));
      const selectedTerms=new Set(tokens(s.title||'').filter(w=>w.length>=4));
      const ranking=matching.filter(a=>!ownKeys.has(a.url)).map(a=>{
        const words=new Set(tokens(a.title||'').filter(w=>w.length>=4));
        const common=[...selectedTerms].filter(t=>words.has(t));
        return {article:a,name:sourceInfo(a).name,common,score:common.length};
      }).filter(x=>x.score>=2).sort((a,b)=>b.score-a.score).slice(0,4);
      if(ranking.length){
        const related=document.createElement('section');
        related.className='bias-related';
        related.innerHTML='<h3>Related right-rated headlines <small>Not verified as the same event</small></h3>'+
          '<p>Suggestions share words with this story. Verify the event and reporting before calling a source absent or comparing facts.</p>'+
          ranking.map(x=>{
            const a=x.article,r=rated(x.name);
            return '<div class="bias-related-row"><span class="bias-pill" style="--bias-tone:'+hues[r.rating]+'">'+escapeHTML(r.rating)+'</span> '+
             '<a href="'+escapeHTML(a.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(a.title)+'</a>'+
             '<small>'+escapeHTML(x.name)+' · shared terms: '+escapeHTML(x.common.slice(0,3).join(', '))+'</small></div>';
          }).join('');
        detailTop.append(related);
      }else if(!articles.some(a=>['Right','Lean Right'].includes(rated(sourceInfo(a).name).rating))){
        const note=document.createElement('p');note.className='bias-no-match';
        note.textContent='No right-rated article is confirmed in this story group. That does not mean no right-rated publisher covered the event; explore the all-sample Right filter for other headlines.';
        detailTop.append(note);
      }
    }

    const grid=document.querySelector('.compare-grid');if(grid)grid.before(chart);
    document.querySelectorAll('.coverage-row').forEach(row=>{
      const name=row.querySelector('.outlet-name')?.textContent?.trim();if(!name)return;
      const r=rated(name),sub=row.querySelector('.outlet-sub');if(sub){const tag=document.createElement('span');tag.className='bias-outlet-badge';tag.innerHTML=badge(name);sub.after(tag)}
      const audited=window.OpenLensSourceAudit?.lookup(name);if(audited&&sub){const kind=document.createElement('span');kind.className='bias-source-kind';kind.textContent=audited.type;kind.title=audited.typeExplanation;sub.after(kind)}
      if(r.source){const foot=row.querySelector('.coverage-footer');if(foot){const a=document.createElement('a');a.href=r.source;a.textContent=`AllSides ${r.rating} · confidence ${r.confidence} ↗`;a.target='_blank';a.rel='noopener noreferrer';foot.append(a)}}
    });
    const context=document.querySelectorAll('.story-analytics .analytic-item');context.forEach(el=>{const name=el.querySelector('strong')?.textContent?.trim();if(!name)return;const old=el.querySelector('.pill-outline');if(old)old.outerHTML=badge(name)});
    document.querySelectorAll('.story-card').forEach(card=>{
      const id=card.dataset.story,story=state.stories.find(t=>t.id===id);if(!story)return;
      const meta=card.querySelector('.story-meta');if(meta){let box=document.createElement('div');box.style.width='100%';box.innerHTML=segments(counts(filteredArticles(story))).replace('class="bias-strip"','class="bias-strip compact"');box.title='Source leaning breakdown, including unrated';meta.after(box)}
    });
    const matrix=document.querySelector('.fact-card')?.closest('.panel')||[...document.querySelectorAll('.panel')].find(x=>x.querySelector('.panel-head h3')?.textContent?.includes('Evidence / omission'));
    const body=matrix?.querySelector('.panel-body'),callout=body?.querySelector('.source-callout');if(body){const wrap=document.createElement('div');wrap.innerHTML=reviewSummary(s,articles);if(callout)callout.after(wrap.firstElementChild);else body.prepend(wrap.firstElementChild)}
  }
  const originalRender=render;
  render=function(){originalRender();decorate()};
  document.addEventListener('change',e=>{if(e.target.id==='biasFilter'){biasFilter=e.target.value;state.selected=null;state.expanded=false;render()}});
  document.addEventListener('click',e=>{if(e.target.closest('[data-action="clear"]')){biasFilter='all'}},true);
  document.addEventListener('click',e=>{const b=e.target.closest?.('[data-ol-lean]');if(b){biasFilter=b.dataset.olLean;state.selected=null;state.expanded=false;render()}});
  decorate();
})();
