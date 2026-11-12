import {test} from 'node:test';
import assert from 'node:assert/strict';
import '../story-cluster-core.js';

const engine=globalThis.OpenLensStoryClusters;
const article=(title,source='NOS',when='2026-11-12T11:00:00.000Z')=>({
 title,source,when,url:'https://example.com/'+encodeURIComponent(title)+'/'+source
});
const together=(first,second)=>engine.group([first,second]).length===1;

test('clustering module exposes a versioned conservative API',()=>{
 assert.equal(engine.version,'2.0');
 assert.equal(typeof engine.features,'function');
 assert.equal(typeof engine.group,'function');
});

test('cross-language Dutch and English lower house housing vote can match',()=>{
 assert.ok(together(
  article('Tweede Kamer stemt over nieuw voorstel voor woningbouw'),
  article('Dutch lower house votes on new housing proposal','POLITICO')
 ));
});

test('EU Commission multilingual technology proposal can match',()=>{
 assert.ok(together(
  article('Europese Commissie presenteert nieuw voorstel voor AI-regels'),
  article('European Commission proposes new AI rules','EURACTIV')
 ));
});

test('different country targets must not be combined despite many shared words',()=>{
 assert.equal(together(
  article('Trump announces new tariffs on Canada'),
  article('Trump announces new tariffs on China','Reuters')
 ),false);
});

test('approval and rejection of same budget remain separate events',()=>{
 assert.equal(together(
  article('Tweede Kamer keurt begroting voor 2027 goed'),
  article('Tweede Kamer wijst begroting voor 2027 af','NRC')
 ),false);
});

test('two budget years remain separate',()=>{
 assert.equal(together(
  article('Kabinet presenteert begroting voor 2026'),
  article('Kabinet presenteert begroting voor 2027','NRC')
 ),false);
});

test('different policies on same day must not be merged',()=>{
 assert.equal(together(
  article('Kabinet bespreekt woningbouw in Nederland'),
  article('Kabinet bespreekt asielmaatregelen in Nederland','AD')
 ),false);
});

test('same headline more than four days apart is not treated as one event',()=>{
 assert.equal(together(
  article('EU reaches agreement on new migration law','NRC','2026-11-12T11:00:00.000Z'),
  article('EU reaches agreement on new migration law','EURACTIV','2026-11-01T11:00:00.000Z')
 ),false);
});

test('bridge headline cannot merge unrelated articles by transitive overlap',()=>{
 const a=article('Rutte bespreekt nieuwe NAVO-defensieplannen','NOS');
 const b=article('Rutte discusses NATO defence plans for allies','Reuters');
 const c=article('Rutte discusses budget proposals for housing','NRC');
 const groups=engine.group([a,b,c]);
 assert.equal(groups.length,2);
 assert.ok(groups.some(g=>g.articles.length===2));
 assert.ok(groups.some(g=>g.articles.some(x=>x.title===c.title)&&g.articles.length===1));
});

test('match confidence is always explicitly unverified and single reports stay single',()=>{
 const grouped=engine.group([
  article('Europese Commissie presenteert nieuw voorstel voor AI-regels'),
  article('European Commission proposes new AI rules','POLITICO')
 ]);
 assert.equal(grouped.length,1);
 assert.ok(['strong','tentative'].includes(grouped[0].confidence));
 assert.ok(grouped[0].method.includes('not full-text'));
 const lone=engine.group([article('Unieke kop zonder enig ander artikel')]);
 assert.equal(lone[0].confidence,'single');
 assert.equal(lone[0].score,null);
});
