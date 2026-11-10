/* OpenLens sampled publisher leaning metrics.
 * Only externally rated named newsrooms appear in political percentages.
 * Unrated and institutional sources are separate and never silently treated as Center.
 */
(function(root){
'use strict';
const allowed=Object.freeze(['Left','Lean Left','Center','Lean Right','Right']);
const group=rating=>['Left','Lean Left'].includes(rating)?'left':['Lean Right','Right'].includes(rating)?'right':rating==='Center'?'center':null;
function summarize(articles,sourceName,lookup){
 const byName=new Map();
 for(const article of articles||[]){
  const name=String(sourceName(article)||'').trim();
  if(!name||byName.has(name.toLowerCase()))continue;
  byName.set(name.toLowerCase(),name);
 }
 const names=[...byName.values()],counts={left:0,center:0,right:0,unrated:0,other:0};
 const sources=[];
 for(const name of names){
  let external;try{external=lookup(name)||{}}catch{external={}}
  const rating=String(external.rating||'Unrated'),g=group(rating);
  const key=g|| (rating==='Other source'?'other':'unrated');
  counts[key]++;
  sources.push({name,rating,group:key,reference:typeof external.source==='string'?external.source:null});
 }
 const rated=counts.left+counts.center+counts.right;
 const round=v=>rated?Math.round(v*100/rated):0;
 const shares={left:round(counts.left),center:round(counts.center),right:round(counts.right)};
 // Largest remainder: percentages total exactly 100 across rated publishers.
 if(rated){
  const entries=['left','center','right'].map(k=>({k,whole:Math.floor(counts[k]*100/rated),
    rem:(counts[k]*100/rated)%1}));
  let remaining=100-entries.reduce((n,e)=>n+e.whole,0);
  entries.sort((a,b)=>b.rem-a.rem||['left','center','right'].indexOf(a.k)-['left','center','right'].indexOf(b.k));
  for(const row of entries){shares[row.k]=row.whole+(remaining>0?1:0);remaining--}
 }
 return {total:names.length,rated,counts,shares,sources,unratedFraction:names.length?counts.unrated/names.length:0};
}
function assessBlindspot(summary,articleCount){
 const c=summary.counts;
 if(summary.rated>=3&&articleCount>=3&&c.left>=2&&c.right===0)return {type:'perspective',side:'right',label:'Geen rechts ingeschaalde bron in steekproef'};
 if(summary.rated>=3&&articleCount>=3&&c.right>=2&&c.left===0)return {type:'perspective',side:'left',label:'Geen links ingeschaalde bron in steekproef'};
 if(summary.total>=2&&summary.rated<2)return {type:'classification',side:null,label:'Weinig politiek geclassificeerde bronnen'};
 if(summary.total>=3&&summary.unratedFraction>=0.6)return {type:'classification',side:null,label:'Veel bronnen zonder politieke beoordeling'};
 if(summary.total===1)return {type:'sampling',side:null,label:'Slechts één bron gevonden'};
 return null;
}
root.OpenLensCoverage=Object.freeze({allowed,group,summarize,assessBlindspot});
})(window);
