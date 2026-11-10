import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const src=await readFile(new URL('../official-milestones.js',import.meta.url),'utf8');
test('official check persists verified-domain records separately from news history',async()=>{
 const db=new Map(),handlers={};
 const sourceWatch={version:1,items:[{id:'watch-1',title:'Belastingplan 2027',query:'belastingplan 2027'}]};
 db.set('openlens.story-watch.v1',JSON.stringify(sourceWatch));
 const document={
  head:{append(){}},createElement(){return {textContent:'',append(){}}},
  querySelectorAll(){return []},querySelector(){return null},
  addEventListener(type,handler,capture){if(type==='click'&&capture)handlers.click=handler}
 };
 let count=0;
 const records=[
 {id:'tk-activiteit-a12b35c0-aaaa-4bbb-8ccc-100000000001',source:'Tweede Kamer Open Data',
  jurisdiction:'Netherlands',title:'Stemming Belastingplan 2027',date:'2026-11-11T10:00:00Z',
  label:'Parliamentary vote session',stageNote:'Activity, not a verified vote result',officialStatus:'Gepland',
  sourceUrl:'https://gegevensmagazijn.tweedekamer.nl/OData/v5/Activiteit(a12b35c0-aaaa-4bbb-8ccc-100000000001)'},
 {id:'tk-activiteit-a12b35c0-aaaa-4bbb-8ccc-100000000002',source:'Fake publisher',
  jurisdiction:'Netherlands',title:'A fake proposal',date:'2026-11-11T10:00:00Z',
  sourceUrl:'https://example.com/fake'}
 ];
 const scope={document,localStorage:{getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)},
  state:{view:'dashboard'},render(){},URL,URLSearchParams,Date,Set,Map,Math,AbortController,
  setTimeout,clearTimeout,
  fetch:async()=>{count++;return {ok:true,json:async()=>({events:records,sourceStatus:[{source:'Dutch activities',status:'ok',count:2}],checkedAt:'2026-11-10T13:00:00Z'})}}};
 runInNewContext(src,scope);
 const target={dataset:{olOfficialCheck:'watch-1'}};
 handlers.click({target:{closest:()=>target}});
 await new Promise(r=>setTimeout(r,30));
 assert.equal(count,1);
 const v=JSON.parse(db.get('openlens.story-watch.official.v1'));
 assert.equal(v.version,1);
 assert.equal(v.byWatch['watch-1'].newCount,1);
 assert.equal(v.byWatch['watch-1'].events.length,1);
 assert.match(v.byWatch['watch-1'].events[0].title,/Belastingplan/);
 assert.equal(db.get('openlens.story-watch.v1'),JSON.stringify(sourceWatch));
});
test('official milestone styling is bundled and separate from media cards',()=>{
 assert.match(src,/\.ol-official-panel\{/);
 assert.match(src,/\.ol-official-event\{/);
 assert.match(src,/originalRecord|recordType|stageNote/);
 assert.match(src,/new Set\(\(record\.seen\|\|\[\]\)/);
});
