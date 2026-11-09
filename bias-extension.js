/* OpenLens coverage perspectives extension, 2026-11-09.
   AllSides Media Bias Ratings™ by AllSides.com, CC BY-NC 4.0.
   Used with attribution for this noncommercial prototype.
   Ratings concern publisher-level online US political coverage, not an individual article's truth.
*/
(function () {
  'use strict';
  // Data checked against publisher profile pages on 2026-11-09.
  const ratings = Object.freeze({
    'Reuters': {rating:'Center', confidence:'High', source:'https://www.allsides.com/news-source/reuters-media-bias'},
    'Associated Press': {rating:'Lean Left', confidence:'Medium', source:'https://www.allsides.com/news-source/associated-press-media-bias'},
    'BBC': {rating:'Center', confidence:'Medium', source:'https://www.allsides.com/news-source/bbc-news-media-bias'},
    'The Guardian': {rating:'Left', confidence:'Low / initial', source:'https://www.allsides.com/news-source/guardian-media-bias'},
    'The New York Times': {rating:'Lean Left', confidence:'High', source:'https://www.allsides.com/news-source/new-york-times-news-media-bias'},
    'NPR': {rating:'Lean Left', confidence:'Medium', source:'https://www.allsides.com/news-source/npr-media-bias'},
    'Fox News': {rating:'Right', confidence:'Medium', source:'https://www.allsides.com/news-source/fox-news-media-bias'}
  });
  const buckets=['Left','Lean Left','Center','Lean Right','Right','Unrated'];
  const hues={'Left':'#2464B8','Lean Left':'#79A7DE','Center':'#8994A6','Lean Right':'#EB9A9B','Right':'#C94D59','Unrated':'#E0E4EB'};
  const modes={all:'All leanings',left:'Left / Lean Left',center:'Center',right:'Right / Lean Right',unrated:'Unrated'};
  let biasFilter='all';
  const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rated=name=>ratings[name]||{rating:'Unrated',confidence:'Not assessed',source:null};
  const groupMatches=r=>biasFilter==='all'||(biasFilter==='left'&&['Left','Lean Left'].includes(r))||(biasFilter==='right'&&['Right','Lean Right'].includes(r))||(biasFilter==='center'&&r==='Center')||(biasFilter==='unrated'&&r==='Unrated');
  const uniqueSources=articles=>[...new Set(articles.map(a=>sourceInfo(a).name))];
  const counts=articles=>{const out=Object.fromEntries(buckets.map(n=>[n,0]));uniqueSources(articles).forEach(n=>out[rated(n).rating]++);return out};
  const legend=out=>buckets.map(n=>`<span class="bias-legend-item"><i style="background:${hues[n]}"></i>${escapeHTML(n)} <strong>${out[n]||0}</strong></span>`).join('');
  const segments=out=>{let total=Object.values(out).reduce((a,b)=>a+b,0);if(!total)return '<div class="bias-strip empty-strip"></div>';return `<div class="bias-strip" role="img" aria-label="Publisher distribution: ${buckets.map(b=>`${b} ${out[b]}`).join(', ')}">${buckets.filter(b=>out[b]).map(b=>`<span style="background:${hues[b]};width:${out[b]/total*100}%" title="${b}: ${out[b]} of ${total} distinct publishers"></span>`).join('')}</div>`};
  const badge=name=>{let r=rated(name);return `<span class="bias-pill" style="--bias-tone:${hues[r.rating]}" title="${escapeHTML(r.source?`AllSides: ${r.rating} • ${r.confidence} confidence • rating applies mainly to online US political coverage`:'No checked rating available')}">${escapeHTML(r.rating)}</span>`};
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
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
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
    const articles=filteredArticles(s),values=counts(articles),ratedN=uniqueSources(articles).length-values.Unrated;
    const chart=document.createElement('section');chart.className='bias-panel';chart.setAttribute('aria-label','Political coverage distribution');chart.innerHTML=`<div class="bias-panel-head"><h3>Political coverage balance</h3><small>${uniqueSources(articles).length} distinct publisher${uniqueSources(articles).length===1?'':'s'} · ${ratedN} rated</small></div>${segments(values)}<div class="bias-legend">${legend(values)}</div><p class="bias-method">Shares reflect <strong>sampled publishers</strong> for the selected story, not total articles or public opinion. Ratings: <a href="https://www.allsides.com/media-bias" target="_blank" rel="noopener">AllSides Media Bias Ratings™</a>, checked Nov 9, 2026 (CC BY-NC 4.0). Primarily U.S. political news; an outlet rating does not classify or verify any particular article. Unrated sources stay visible.</p>`;
    const grid=document.querySelector('.compare-grid');if(grid)grid.before(chart);
    document.querySelectorAll('.coverage-row').forEach(row=>{
      const name=row.querySelector('.outlet-name')?.textContent?.trim();if(!name)return;
      const r=rated(name),sub=row.querySelector('.outlet-sub');if(sub){const tag=document.createElement('span');tag.className='bias-outlet-badge';tag.innerHTML=badge(name);sub.after(tag)}
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
  decorate();
})();
