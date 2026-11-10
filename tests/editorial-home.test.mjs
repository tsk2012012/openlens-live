import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const src=await readFile(new URL('../editorial-home.js',import.meta.url),'utf8');
test('editorial browse opens a story before revealing detailed analysis',()=>{
 const handlers={};
 const style={textContent:''};
 const dom={
   head:{append(){}},
   createElement(){return {...style}},
   addEventListener(event,callback,capture){if(event==='click'&&capture)handlers.click=callback},
   querySelector(){return null},
   getElementById(){return null}
 };
 const story={id:'example-1',title:'Example event',topic:'World',demo:false,articles:[]};
 const page={
   document:dom,window:{scrollTo(){}},state:{view:'dashboard',mode:'live',loading:false,expanded:false,lastFetched:null,selected:'example-1'},
   dashboard:()=>'<div>old-dashboard</div>',render(){},
   filterStories:()=>[story],filteredArticles:()=>[{title:'Example event',url:'https://example.org/article',source:'Publisher A',kind:'Reporting',when:'2026-11-10'}],
   sourceInfo:a=>({name:a.source}),sourcesCount:()=>1,ESC:v=>String(v),relative:()=> 'Recent',getSaved:()=>false,
   safeURL:u=>u,link:(url,caption)=>'<a href="'+url+'">'+caption+'</a>',
   timeFmt:()=> 'Now',filterSection:()=>'<div class="filterbar">Filters</div>',
   comparisonDetail:()=>'<div class="detail"><div class="panel">Comparison details</div></div>'
 };
 runInNewContext(src,page);
 const browse=page.dashboard();
 assert.match(browse,/ol-newsroom-grid/);
 assert.match(browse,/data-ol-open-story="example-1"/);
 assert.doesNotMatch(browse,/Comparison details/);
 let stopped=false;
 handlers.click({target:{closest(){return {dataset:{olOpenStory:'example-1'}}}},preventDefault(){},stopImmediatePropagation(){stopped=true}});
 assert.equal(stopped,true);
 const detail=page.dashboard();
 assert.match(detail,/Reporting at a glance/);
 assert.match(detail,/Comparison details/);
 assert.match(detail,/Back to all stories/);
});
test('existing bookmarks and publisher data are preserved',()=>{
 assert.match(src,/data-action="save"/);
 assert.match(src,/filterSection\(\)/);
 assert.match(src,/comparisonDetail\(s\)/);
 assert.match(src,/window\.OpenLensEditorialCore|does not certify article accuracy/);
 assert.match(src,/data-ol-story-back/);
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/editorial-home\.js\?v=/);
});
