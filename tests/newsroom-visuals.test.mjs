import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('persistent dark-mode toggle and topic hierarchy are accessible',async()=>{
 const ui=await read('newsroom-visuals.js');
 assert.match(ui,/openlens\.display\.theme\.v1/);
 assert.match(ui,/data-ol-theme-toggle/);
 assert.match(ui,/olTheme=theme/);
 assert.match(ui,/aria-pressed/);
 for(const group of ['Uitgelicht','Nederland','Europese Unie','Economie & beleid','Samenleving','Internationaal'])assert.ok(ui.includes(group));
 assert.match(ui,/dispatchEvent\(new Event\('change'/);
});
test('publisher-derived images display only after metadata checks',async()=>{
 const ui=await read('newsroom-visuals.js');
 assert.match(ui,/api\/article-preview/);
 assert.match(ui,/IntersectionObserver/);
 assert.match(ui,/referrerPolicy='no-referrer'/);
 assert.match(ui,/Bronbeeld niet beschikbaar/);
 assert.match(ui,/has-photo/);
});
test('cards and blindspots use same evidence-aware publisher metrics',async()=>{
 const ui=await read('newsroom-visuals.js'),home=await read('editorial-home.js');
 assert.match(ui,/OpenLensCoverage/);
 assert.match(ui,/metrics\.summarize/);
 const core=await read('blindspots-core.js');
 assert.match(core,/metrics[.]assessBlindspot/);
 assert.match(ui,/politiek beoordeeld/);
 assert.match(ui,/OpenLens verzint geen politieke oriëntaties/i);
 assert.match(ui,/data-view="blindspots"/);
 assert.match(home,/window\.OpenLensOpenStory=openStory/);
});
test('new visual scripts are available in both deployment and local server',async()=>{
 const html=await read('index.html'),dev=await read('dev-server.mjs');
 assert.ok(html.indexOf('coverage-metrics.js?v=')<html.indexOf('newsroom-visuals.js?v='));
 assert.ok(html.indexOf('official-milestones.js?v=')<html.indexOf('coverage-metrics.js?v='));
 assert.match(dev,/coverage-metrics\.js/);
 assert.match(dev,/newsroom-visuals\.js/);
});

test('topic navigation follows the selected topic and image metadata uses a fresh cache key',async()=>{const ui=await read('newsroom-visuals.js');assert.match(ui,/category=topicGroups\.find/);assert.match(ui,/visual:'20261110v2'/);});
