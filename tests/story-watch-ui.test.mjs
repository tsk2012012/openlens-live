import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const src=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('Story Watch is wired to the reader, navigation, local storage and manual checks',async()=>{
 const watch=await src('story-watch.js'),html=await src('index.html'),dev=await src('dev-server.mjs');
 assert.match(watch,/Story Watch/);
 assert.match(watch,/openlens\.story-watch\.v1/);
 assert.match(watch,/data-ol-watch-story/);
 assert.match(watch,/data-ol-check/);
 assert.match(watch,/data-ol-watch-add/);
 assert.match(watch,/query:fixed/);
 assert.match(watch,/w\.seen=/);
 assert.match(watch,/Keyword match/);
 assert.match(html,/story-watch\.js\?v=/);
 assert.match(dev,/\/api\/watch/);
 assert.match(dev,/story-watch\.js/);
});
test('news topics cover Dutch and EU civic priorities',async()=>{
 const html=await src('index.html'),layout=await src('layout-redesign.js'),news=await src('api/news.js');
 for(const t of ['netherlands','housing','public-finances','eu-institutions','local-government','digital-policy','rule-of-law','labor','social-policy']){
  assert.match(html,new RegExp(t));
  assert.match(news,new RegExp(t));
 }
 assert.match(layout,/Explore by topic/);
 assert.match(news,/dutch-national-publishers/);
 assert.match(news,/european-news-publishers/);
 assert.match(news,/official-institutional-sources/);
 assert.match(news,/nonrepresentative sample/);
});
