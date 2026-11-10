import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const root={};runInNewContext(await readFile(new URL('../blindspots-core.js',import.meta.url),'utf8'),{window:root});
const coverage={};runInNewContext(await readFile(new URL('../coverage-metrics.js',import.meta.url),'utf8'),{window:coverage});
const audit=root.OpenLensBlindspotAudit,metrics=coverage.OpenLensCoverage;
const article=n=>({name:n}),story=(id,names)=>({id,title:id,articles:names.map(article),match:'Tentative headline match'});
const rating=n=>({A:'Lean Left',B:'Left',C:'Right',D:'Unrated',E:'Other source'})[n]?{rating:({A:'Lean Left',B:'Left',C:'Right',D:'Unrated',E:'Other source'})[n]}:null;
const lookup=n=>({type:n==='E'?'Government / legislature':'News outlet / publisher',identityStatus:n==='X'?'Not yet identified':'Explicitly classified',politicallyAssessable:n!=='E'});
const orientation=n=>n==='D'?{orientation:'Liberal',source:'https://www.eurotopics.net/en/example'}:null;
const scan=stories=>audit.analyze(stories,s=>s.articles,a=>a.name,rating,lookup,metrics,orientation);
test('many unassessed outlets are counted as metadata gaps, not dozens of political blindspots',()=>{
 const stories=Array.from({length:25},(_,i)=>story('s'+i,['A','D','E']));
 const d=scan(stories);
 assert.equal(d.metrics.candidates,0);
 assert.equal(d.metrics.dataLimited,25);
 assert.equal(d.metrics.oneSource,0);
 assert.equal(d.unrated.length,1);
 assert.equal(d.unknown.length,0);
 assert.equal(d.unrated[0].orientation,'Liberal');
});
test('evidence-backed missing political side needs three rated publishers and coverage',()=>{
 const d=scan([story('story1',['A','B','D']),story('story2',['A','B','A'])]);
 assert.equal(d.metrics.candidates,0);
 assert.equal(d.metrics.comparable,2);
});
test('single outlet stories are sampling limits not known bias absences',()=>{
 const d=scan([story('solo',['A']),story('solo2',['X'])]);
 assert.equal(d.metrics.candidates,0);
 assert.equal(d.metrics.oneSource,2);
 assert.equal(d.metrics.unknownIdentity,1);
});
test('source-type classifications and political orientations remain separate',()=>{
 const d=scan([story('mix',['A','D','E','X']),story('next',['D','A'])]);
 assert.equal(d.metrics.uniquePublishers,4);
 assert.equal(d.metrics.institutional,1);
 assert.equal(d.metrics.editorialWithoutRating,1);
 assert.equal(d.metrics.unknownIdentity,1);
});
test('blindspots navigation shows source research instead of repeated insufficient labels',async()=>{
 const ui=await readFile(new URL('../newsroom-visuals.js',import.meta.url),'utf8');
 for(const name of ['Blinde vlekken & brononderzoek','Uitgevers & profielen','Steekproefkwaliteit','Kandidaat-perspectiefgaten'])assert.ok(ui.includes(name));
 assert.match(ui,/data-ol-spot-filter/);
 assert.match(ui,/auditReport\(\)/);
 assert.doesNotMatch(ui,/>Onvoldoende bronclassificaties</);
});

test('blindspots cards include coverage bars and trigger trusted publisher photo loading',async()=>{
 const ui=await readFile(new URL('../newsroom-visuals.js',import.meta.url),'utf8');
 assert.match(ui,/function enhanceBlindspotPhotos/);
 assert.match(ui,/observeCover\(story,art\)/);
 assert.match(ui,/blindspotView\(\);enhanceBlindspotPhotos\(\)/);
 assert.match(ui,/\.ol-spot-item \.ol-card-cover/);
 assert.match(ui,/bar\(m\)\)\+'<p><strong>Bronnen:/);
});
