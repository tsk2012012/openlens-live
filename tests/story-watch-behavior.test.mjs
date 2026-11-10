import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const script=await readFile(new URL('../story-watch.js',import.meta.url),'utf8');
test('Story Watch can follow an existing story and discover new links on a manual check',async()=>{
 const handlers={},db=new Map(),content={innerHTML:''},breadcrumb={textContent:''};
 const document={
  head:{append(){}},
  createElement(){return {textContent:''}},
  querySelector(selector){return null},
  querySelectorAll(){return []},
  getElementById(id){return id==='content'?content:id==='breadcrumb'?breadcrumb:null},
  addEventListener(name,callback,capture){if(capture===true&&name==='click')handlers.click=callback;else if(name==='submit')handlers.submit=callback}
 };
 const story={id:'story-1',title:'Woningbouw kabinet bespreekt locaties',topic:'Housing',
  articles:[{title:'Woningbouw kabinet plan',url:'https://publisher.example.nl/seen',source:'Publisher A'}]};
 const localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)};
 const mockArticles=[
  {title:'Woningbouw kabinet besluit over locaties',url:'https://publisher.example.nl/new-1',source:'Publisher B',when:'2026-11-10T12:00:00Z',locale:'Dutch / Netherlands'},
  {title:'Sports update and match results',url:'https://publisher.example.nl/sport',source:'Publisher C',when:'2026-11-10T12:00:00Z',locale:'Dutch / Netherlands'}
 ];
 let fetches=0;
 const scope={
  document,localStorage,state:{view:'dashboard',stories:[story],selected:'story-1'},
  window:{scrollTo(){},confirm:()=>true},render(){},toast(){},URL,URLSearchParams,AbortController,
  setTimeout,clearTimeout,Date,Math,Object,Map,Set,
  fetch:async()=>{fetches++;return {ok:true,json:async()=>({articles:mockArticles,fetchedAt:'2026-11-10T13:00:00Z'})}},
  FormData:class{constructor(form){this.data=form.fields}get(k){return this.data[k]}}
 };
 runInNewContext(script,scope);
 assert.equal(typeof handlers.click,'function');
 const button={dataset:{olWatchStory:'story-1'},closest:()=>null};
 let stopped=false;
 handlers.click({target:{closest:()=>button},preventDefault(){},stopImmediatePropagation(){stopped=true}});
 assert.equal(stopped,true);
 assert.equal(scope.state.view,'watch');
 assert.match(content.innerHTML,/Woningbouw kabinet bespreekt locaties/);
 const save=JSON.parse(db.get('openlens.story-watch.v1'));
 assert.equal(save.items.length,1);
 assert.deepEqual(Array.from(save.items[0].seen),['https://publisher.example.nl/seen']);
 const id=save.items[0].id;
 const check={dataset:{olCheck:id},closest:()=>null};
 handlers.click({target:{closest:()=>check}});
 await new Promise(r=>setTimeout(r,30));
 const updated=JSON.parse(db.get('openlens.story-watch.v1'));
 assert.equal(fetches,1);
 assert.equal(updated.items[0].newCount,1);
 assert.equal(updated.items[0].lastFound,1);
 assert.match(content.innerHTML,/1 newly found/);
 assert.match(content.innerHTML,/publisher\.example\.nl\/new-1/);
 assert.doesNotMatch(content.innerHTML,/Sports update and match results/);
});
