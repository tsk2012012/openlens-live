/* OpenLens blindspot audit v2.
 * A missing published bias rating is a source-metadata limitation, not an omission.
 * Fewer than 3 distinct rated publishers cannot support a political-gap candidate.
 */
(function(root){
'use strict';
const normalize=s=>String(s??'').toLocaleLowerCase().trim();
function analyze(stories,articlesOf,sourceOf,ratingLookup,identityLookup,metrics,orientationLookup){
 const records=[],publishers=new Map();
 let articleCount=0;
 for(const story of stories||[]){
  if(story.demo)continue;
  const articles=articlesOf(story)||[];
  if(!articles.length)continue;
  articleCount+=articles.length;
  const summary=metrics.summarize(articles,sourceOf,ratingLookup);
  const flag=metrics.assessBlindspot(summary,articles.length);
  const entry={story,summary,articleCount:articles.length,flag};
  records.push(entry);
  const names=new Set();
  for(const article of articles){
   const name=String(sourceOf(article)||'').trim(),key=normalize(name);
   if(!name)continue;
   if(!publishers.has(key)){
    const meta=identityLookup(name)||{},rating=ratingLookup(name)||{},orientation=orientationLookup?.(name)||null;
    publishers.set(key,{
     name,type:meta.type||'Identity review needed',
     identityReviewed:meta.identityStatus!=='Not yet identified'&&meta.type!=='Identity review needed',
     assessable:meta.politicallyAssessable!==false,rating:rating.rating||null,
     orientation:orientation?.orientation||rating.originalOrientation||null,
     orientationUrl:orientation?.source||null,
     articles:0,stories:0,
     ratingUrl:rating.source||null,provider:rating.provider||null
    });
   }
   publishers.get(key).articles++;
   names.add(key);
  }
  for(const n of names)publishers.get(n).stories++;
 }
 const list=[...publishers.values()];
 const candidates=records.filter(x=>x.flag?.type==='perspective'&&
  x.summary.total>=3&&x.summary.rated>=3&&
  x.summary.rated/x.summary.total>=.6&&x.articleCount>=3
 ).sort((a,b)=>b.summary.rated-a.summary.rated||b.articleCount-a.articleCount);
 const opportunities=records.filter(x=>x.summary.total>=2&&x.articleCount>=2)
  .sort((a,b)=>b.summary.total-a.summary.total||b.articleCount-a.articleCount);
 const singles=records.filter(x=>x.summary.total===1);
 const sparse=records.filter(x=>x.summary.total>=2&&x.summary.rated<2);
 const editorial=list.filter(x=>x.assessable&&x.identityReviewed);
 const rated=editorial.filter(x=>['Left','Lean Left','Center','Lean Right','Right'].includes(x.rating));
 const unrated=editorial.filter(x=>!['Left','Lean Left','Center','Lean Right','Right'].includes(x.rating))
  .sort((a,b)=>b.articles-a.articles||a.name.localeCompare(b.name,'nl'));
 const unknown=list.filter(x=>!x.identityReviewed)
  .sort((a,b)=>b.articles-a.articles||a.name.localeCompare(b.name,'nl'));
 const institutional=list.filter(x=>!x.assessable);
 return {
  records,candidates,opportunities,singles,sparse,
  publishers:list,unrated,unknown,institutional,
  metrics:{
   stories:records.length,articles:articleCount,uniquePublishers:list.length,
   candidates:candidates.length,comparable:opportunities.length,oneSource:singles.length,
   dataLimited:sparse.length,classifiedEditorial:rated.length,
   editorialWithoutRating:unrated.length,unknownIdentity:unknown.length,
   institutional:institutional.length,
   orientationProfiles:list.filter(x=>x.orientation).length
  }
 };
}
root.OpenLensBlindspotAudit=Object.freeze({analyze});
})(window);
