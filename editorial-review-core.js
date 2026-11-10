/* OpenLens article evidence model: not an external publisher rating. */
(function(root){
'use strict';
const VERSION=1;
const TOPICS=['Politics','Migration','Gaza','Ukraine','Geopolitics','EU policy','Business','Climate','Technology','Health','Other'];
const FRAMES=['United States','Netherlands','International / other'];
const KINDS=['Reporting','Analysis','Opinion','Unknown'];
const BASIS=['Framing / emphasis','Source selection','Language / tone','Context / omissions','Other'];
const LEANS=['Left','Lean Left','Center / mixed','Lean Right','Right','Insufficient evidence'];
const THRESHOLD=Object.freeze({articles:15,topics:3,reviewers:3,days:21});
const trim=(v,n)=>String(v??'').trim().slice(0,n);
const key=v=>trim(v,180).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function date(v){
 const s=trim(v,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return '';
 const d=new Date(s+'T00:00:00Z');
 return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s?s:'';
}
function directUrl(v){
 try{
  const u=new URL(trim(v,2048));
  if(u.protocol!=='https:'||!u.hostname||u.username||u.password||/(^|\.)news\.google\.com$/i.test(u.hostname))return null;
  return u.toString();
 }catch{return null}
}
function validateEvidence(input,now){
 const v=input&&typeof input==='object'?input:{},errors=[];
 const publisher=trim(v.publisher,160),articleTitle=trim(v.articleTitle,300),articleUrl=directUrl(v.articleUrl),
   publishedAt=date(v.publishedAt),reviewer=trim(v.reviewer,80),topic=trim(v.topic,40),
   frame=trim(v.frame,50),kind=trim(v.kind,35),basis=trim(v.basis,60),
   observation=trim(v.observation,1800),lean=trim(v.lean,40);
 if(publisher.length<2)errors.push('Select a publisher.');
 if(articleTitle.length<8)errors.push('Enter the article title (at least 8 characters).');
 if(!articleUrl)errors.push('Provide a direct HTTPS publisher article URL, not a Google News link.');
 if(!publishedAt)errors.push('Enter a valid publication date.');
 else if(Date.parse(publishedAt+'T00:00:00Z')>(now||Date.now())+86400000)errors.push('Publication date cannot be in the future.');
 if(reviewer.length<2)errors.push('Enter a reviewer name or initials (self-reported).');
 if(!TOPICS.includes(topic))errors.push('Choose a topic.');
 if(!FRAMES.includes(frame))errors.push('Choose a political reference frame.');
 if(!KINDS.includes(kind))errors.push('Choose a content format.');
 if(!BASIS.includes(basis))errors.push('Choose an evidence category.');
 if(!LEANS.includes(lean))errors.push('Choose a framing observation.');
 if(observation.length<40)errors.push('Describe specific evidence in at least 40 characters.');
 if(v.fullTextRead!==true)errors.push('Confirm that you read the original article.');
 if(errors.length)return {ok:false,errors};
 const nowIso=new Date(now||Date.now()).toISOString();
 const recordedAt=/^\d{4}-\d\d-\d\dT/.test(String(v.recordedAt||''))&&Number.isFinite(+new Date(v.recordedAt))?new Date(v.recordedAt).toISOString():nowIso;
 return {ok:true,value:{
  id:trim(v.id,100)||'e-'+Math.random().toString(36).slice(2)+'-'+Date.now().toString(36),
  publisher,articleTitle,articleUrl,publishedAt,reviewer,topic,frame,kind,basis,observation,lean,
  fullTextRead:true,recordedAt,provenance:'Self-reported local review, not independently verified'
 }};
}
const fingerprint=v=>[key(v.publisher),String(v.articleUrl||'').toLowerCase(),key(v.reviewer)].join('|');
function appendEvidence(records,input,now){
 const next=validateEvidence(input,now);
 if(!next.ok)return next;
 if((records||[]).some(r=>fingerprint(r)===fingerprint(next.value)))return {ok:false,errors:['This reviewer already logged this publisher article.']};
 if((records||[]).length>=1500)return {ok:false,errors:['Export your local research before adding more than 1,500 entries.']};
 return next;
}
function progress(records,publisher,frame){
 const rows=(records||[]).filter(r=>key(r.publisher)===key(publisher)&&r.frame===frame);
 const urls=new Set(rows.map(r=>String(r.articleUrl).toLowerCase()));
 const topics=new Set(rows.map(r=>r.topic));
 const reviewers=new Set(rows.map(r=>key(r.reviewer)));
 const dates=[...new Set(rows.map(r=>r.publishedAt))].map(d=>Date.parse(d+'T00:00:00Z')).filter(Number.isFinite);
 const spanDays=dates.length>1?Math.floor((Math.max(...dates)-Math.min(...dates))/86400000):0;
 const observations=Object.fromEntries(LEANS.map(l=>[l,0]));for(const r of rows)if(observations[r.lean]!==undefined)observations[r.lean]++;
 return {entries:rows.length,articles:urls.size,topics:topics.size,reviewers:reviewers.size,spanDays,observations,
  readyForHumanReview:urls.size>=15&&topics.size>=3&&reviewers.size>=3&&spanDays>=21,
  caveat:'Reviewer identities, sample selection and interpretations are not independently verified. Readiness is not publisher certification.'};
}
function proposal(records,input){
 const v=input||{},publisher=trim(v.publisher,160),frame=trim(v.frame,50),rating=trim(v.rating,50),rationale=trim(v.rationale,2500),errors=[];
 const p=progress(records,publisher,frame);
 if(!p.readyForHumanReview)errors.push('Requires 15 distinct articles, three topics, three self-reported reviewer names and 21 days of publication dates.');
 if(frame==='International / other')errors.push('Select a specific national reference frame for a left-right proposal.');
 if(!['Left','Lean Left','Center','Lean Right','Right','Mixed / not classifiable'].includes(rating))errors.push('Choose a proposed interpretation.');
 if(rationale.length<120)errors.push('Record a nuanced justification and counterevidence (at least 120 characters).');
 if(errors.length)return {ok:false,errors,progress:p};
 return {ok:true,value:{publisher,frame,rating,rationale,createdAt:new Date().toISOString(),
  status:'Private reviewer hypothesis; not an independently published rating'}};
}
function parseImport(input,existing){
 const data=input&&typeof input==='object'?input:{};
 if(data.version!==VERSION||!Array.isArray(data.evidence)||data.evidence.length>1500)return {ok:false,errors:['Not a supported OpenLens review export.']};
 const additions=[],rejected=[],existingKeys=new Set((existing||[]).map(fingerprint));let skipped=0;
 for(const item of data.evidence){
  const v=validateEvidence(item);
  if(!v.ok){rejected.push(v.errors[0]);continue}
  const fp=fingerprint(v.value);
  if(existingKeys.has(fp)){skipped++;continue}
  existingKeys.add(fp);additions.push(v.value);
 }
 if((existing||[]).length+additions.length>1500)return {ok:false,errors:['Import exceeds the local evidence limit.']};
 return {ok:true,additions,rejected,skipped};
}
root.OpenLensEditorialCore=Object.freeze({
 VERSION,TOPICS,FRAMES,KINDS,BASIS,LEANS,THRESHOLD,key,directUrl,
 validateEvidence,appendEvidence,progress,proposal,parseImport
});
})(window);
