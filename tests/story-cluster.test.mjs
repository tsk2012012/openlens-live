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


test('different traffic accidents in different streets are not one event',()=>{
 const titles=[
  'Ongeval met letsel op Lijnbaan in Den Haag',
  'Ongeval met letsel op Nieuwe Parklaan in Den Haag',
  'Ongeval met letsel op Juliana van Stolberglaan in Den Haag',
  'Ongeval met letsel op Bezuidenhoutseweg in Den Haag'
 ];
 const items=titles.map((title,i)=>article(title,'Uitgever '+i));
 assert.equal(engine.group(items).length,4);
});

test('Ukraine diplomatic talks are not combined with a separate attack',()=>{
 assert.equal(together(
  article('Russia attacks Ukraine hours after Abu Dhabi peace talks end'),
  article('EU sends 2 senior officials to Ukraine talks in Abu Dhabi','POLITICO')
 ),false);
});

test('an explainer and deployment of delegation are kept distinct',()=>{
 assert.equal(together(
  article("Who’s who for Europe at the Ukraine talks in Abu Dhabi"),
  article("EU sends 2 senior officials to Ukraine talks in Abu Dhabi",'POLITICO')
 ),false);
});

test('reports of the same EU delegation can still match',()=>{
 assert.equal(together(
  article('EU sends 2 senior officials to Ukraine talks in Abu Dhabi'),
  article('EU to send joint team to Ukraine-Russia peace talks in Abu Dhabi','EURACTIV')
 ),true);
});

test('different individuals speaking at the same COP conference remain separate',()=>{
 assert.equal(together(
  article('John Kerry speaks at the United Nations Climate Change Conference in Antalya Turkey'),
  article('Greta Thunberg speaks at the United Nations Climate Change Conference in Antalya Turkey','Reuters')
 ),false);
});

test('generic EU consumer coverage is not mistaken for a specific law proposal',()=>{
 assert.equal(together(
  article('Lowdown: European Commission proposes Digital Fairness Act to protect online consumers'),
  article('European Commission to better protect consumers from online scams','EURACTIV')
 ),false);
});
