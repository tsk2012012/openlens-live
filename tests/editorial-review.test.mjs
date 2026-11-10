import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const src=await readFile(new URL('../editorial-review-core.js',import.meta.url),'utf8');
const w={};runInNewContext(src,{window:w,URL,Date,Math,Set,Object,Number,String});
const c=w.OpenLensEditorialCore;
const rec=(id,changes={})=>({publisher:'NOS',articleTitle:'Political news headline describing article '+id,
 articleUrl:'https://publisher.example/news/'+id,publishedAt:'2026-10-01',reviewer:'Analyst A',
 topic:'Politics',frame:'Netherlands',kind:'Reporting',basis:'Framing / emphasis',
 lean:'Insufficient evidence',observation:'I checked the full article and documented particular source and wording choices with context.',
 fullTextRead:true,...changes});
test('direct source, date, notes, and full-text reading required',()=>{
 assert.equal(c.validateEvidence(rec(1)).ok,true);
 assert.equal(c.validateEvidence(rec(1,{articleUrl:'https://news.google.com/rss/articles/x'})).ok,false);
 assert.equal(c.validateEvidence(rec(1,{fullTextRead:false})).ok,false);
 assert.equal(c.validateEvidence(rec(1,{observation:'biased'})).ok,false);
});
test('deduplicate per article and reviewer',()=>{
 const saved=c.validateEvidence(rec(1)).value;
 assert.equal(c.appendEvidence([saved],rec(1)).ok,false);
 assert.equal(c.appendEvidence([saved],rec(1,{reviewer:'Analyst B'})).ok,true);
});
test('premature publisher labels are rejected',()=>{
 const p=c.progress([c.validateEvidence(rec(1)).value],'NOS','Netherlands');
 assert.equal(p.readyForHumanReview,false);
 assert.equal(c.proposal([],{publisher:'NOS',frame:'Netherlands',rating:'Center',rationale:'x'.repeat(160)}).ok,false);
});
test('multiple articles and self-reported reviewers make a review eligible for HUMAN evaluation only',()=>{
 const rows=[];
 for(let i=0;i<15;i++){
  rows.push(c.validateEvidence(rec(i,{publishedAt:new Date(Date.UTC(2026,8,1+i*2)).toISOString().slice(0,10),
   reviewer:['A Reviewer','B Reviewer','C Reviewer'][i%3],
   topic:['Politics','Migration','Geopolitics'][i%3]})).value);
 }
 const p=c.progress(rows,'NOS','Netherlands');assert.equal(p.articles,15);assert.equal(p.topics,3);
 assert.equal(p.reviewers,3);assert.equal(p.readyForHumanReview,true);
 assert.match(p.caveat,/not independently verified/);
 const r=c.proposal(rows,{publisher:'NOS',frame:'Netherlands',rating:'Mixed / not classifiable',rationale:'x'.repeat(160)});
 assert.equal(r.ok,true);assert.match(r.value.status,/Private/);
});
test('imports reject unsupported payloads and do not duplicate entries',()=>{
 const item=c.validateEvidence(rec(1)).value;
 const data=c.parseImport({version:1,evidence:[item,item,{id:'invalid'}]},[]);
 assert.equal(data.ok,true);assert.equal(data.additions.length,1);assert.equal(data.rejected.length,1);
 assert.equal(c.parseImport({version:2,evidence:[]},[]).ok,false);
});

test('editorial review interface is accessible and not linked into independent ratings',async()=>{
 const page=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const ui=await readFile(new URL('../editorial-review.js',import.meta.url),'utf8');
 const server=await readFile(new URL('../dev-server.mjs',import.meta.url),'utf8');
 const bias=await readFile(new URL('../bias-extension.js',import.meta.url),'utf8');
 assert.match(page,/editorial-review-core\.js\?v=/);
 assert.match(page,/editorial-review\.js\?v=/);
 assert.match(server,/editorial-review\.js/);
 assert.match(ui,/Editorial review lab/);
 assert.match(ui,/localStorage/);
 assert.match(ui,/Private working hypothesis|private working hypothesis/);
 assert.match(bias,/OpenLensPublisherRatingLookup/);
 assert.doesNotMatch(ui,/window\.OpenLensPublisherRatingLookup\s*=/);
});
