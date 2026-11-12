import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../evidence-core.js';

const core=globalThis.OpenLensEvidenceCore;
const a=(publisher,title,url,preview=null)=>({
 publisher,title,url,preview,when:'2026-11-12T12:00:00Z'
});

test('visible source markers distinguish repeated mentions from one-source signals',()=>{
 const result=core.compare([
  a('NOS','Tweede Kamer keurt begroting voor 2027 goed na debat over woningbouw','https://nos.nl/a'),
  a('NRC','Begroting 2027 besproken in de Tweede Kamer','https://nrc.nl/a')
 ]);
 assert.equal(result.totalSources,2);
 assert.equal(result.previewSources,0);
 assert.equal(result.fullTextVerified,false);
 assert.ok(result.shared.some(row=>row.label==='Tweede Kamer'&&row.sources.length===2));
 assert.ok(result.shared.some(row=>row.label==='Begroting'));
 assert.ok(result.shared.some(row=>row.label==='Jaartal 2027'));
 assert.ok(result.single.some(row=>row.label==='Woningbeleid'));
 assert.ok(result.single.every(x=>x.sources.length===1));
});

test('an article from same named publisher does not become an independent source',()=>{
 const result=core.compare([
  a('NOS','Tweede Kamer bespreekt begroting voor 2027','https://nos.nl/a'),
  a('NOS','Tweede Kamer bespreekt begroting voor 2027','https://nos.nl/b')
 ]);
 assert.equal(result.totalSources,1);
 assert.equal(result.hasComparison,false);
 assert.equal(result.shared.length,0);
});

test('publisher description and lead signals are explicitly attributed',()=>{
 const result=core.compare([
  a('NOS','Kabinet licht plannen toe','https://nos.nl/a',
   {summarySource:'Publisher description',synopsis:'De Tweede Kamer behandelt de begroting voor 2027 en bespreekt nieuw woningbeleid.'}),
  a('NRC','Begroting 2027 in behandeling','https://nrc.nl/a',
   {summarySource:'Extracted article lead',synopsis:'De Tweede Kamer bespreekt de rijksbegroting voor volgend jaar.'})
 ]);
 assert.equal(result.previewSources,2);
 const parliament=result.shared.find(row=>row.id==='tweede-kamer');
 assert.ok(parliament);
 assert.ok(parliament.sources.some(s=>s.from==='beschrijving'));
 assert.ok(parliament.sources.some(s=>s.from==='lead'));
 assert.equal(result.sources[0].previewKind,'beschrijving');
 assert.equal(result.sources[1].previewKind,'lead');
});

test('unverified preview shapes cannot create fabricated observations',()=>{
 const rows=[
  a('NRC','Overleg in Den Haag','https://nrc.nl/a',
   {summarySource:'A full article',synopsis:'The entire paywalled article was extracted.'}),
  a('NOS','Overleg in Den Haag','https://nos.nl/a',
   {summarySource:null,synopsis:'Verzonnen feiten over Oekraïne en Gaza'})
 ];
 const result=core.compare(rows);
 assert.equal(result.previewSources,0);
 assert.ok(result.sources.every(row=>!row.excerpt));
 assert.ok(!result.shared.some(row=>row.id==='ukraine'||row.id==='gaza'));
});

test('year references and amounts are text markers, not inferred factual claims',()=>{
 const result=core.compare([
  a('NOS','Duitsland onderschept 1260 kilo vuurwerk in 2026','https://nos.nl/a'),
  a('NRC','Duitsland onderschept bijna 1300 kilo vuurwerk in 2026','https://nrc.nl/a')
 ]);
 assert.ok(result.shared.some(row=>row.label==='Jaartal 2026'));
 assert.ok(result.shared.some(row=>row.label==='Duitsland'));
 assert.equal(result.fullTextVerified,false);
 assert.ok(result.caveat.includes('geen feiten'));
});

test('only public HTTPS links are eligible, invalid URL cannot be compared',()=>{
 const result=core.compare([
  a('Publisher 1','Nieuws 2026','http://example.com/article'),
  a('Publisher 2','Nieuws 2026','https://nrc.nl/a'),
  a('Publisher 3','Nieuws 2026','https://user:password@nos.nl/a')
 ]);
 assert.equal(result.totalSources,1);
 assert.equal(result.sources[0].publisher,'Publisher 2');
});

test('preview excerpt caps the amount of publisher text displayed',()=>{
 const preview={summarySource:'Publisher description',synopsis:Array.from({length:140},(_,i)=>'woord'+i).join(' ')};
 const result=core.compare([a('NOS','EU besluit','https://nos.nl/a',preview)]);
 assert.ok(result.sources[0].excerpt.split(/\s+/).length<=23);
 assert.equal(result.sources[0].previewKind,'beschrijving');
});

test('similar words from same source not double-counted as separate attribution',()=>{
 const out=core.compare([
  a('NOS','Tweede Kamer Tweede Kamer Tweede Kamer','https://nos.nl/a'),
  a('NRC','Tweede Kamer','https://nrc.nl/a')
 ]);
 const parliament=out.shared.find(x=>x.id==='tweede-kamer');
 assert.equal(parliament.sources.length,2);
 assert.deepEqual(parliament.sources.map(s=>s.publisher),['NOS','NRC']);
});
