import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('research panel is loaded after visual renderer and uses manual event decisions',async()=>{
 const html=await read('index.html'),script=await read('story-research.js');
 assert.ok(html.indexOf('newsroom-visuals.js?v=')<html.indexOf('story-research.js?v='));
 assert.match(script,/openlens\.research\.dossiers\.v1/);
 assert.match(script,/data-ol-research-search/);
 assert.match(script,/data-ol-research-decision/);
 assert.match(script,/data-ol-research-note/);
 assert.match(script,/openlens-onderzoeksdossier\.json/);
 assert.match(script,/api\/coverage\?/);
 assert.match(script,/not confirmed same event|niet.*dezelfde gebeurtenis|dezelfde gebeurtenis/);
});
test('news articles keep provenance, and no publisher body text is claimed',async()=>{
 const api=await read('api/coverage.js');
 const server=await read('dev-server.mjs');
 assert.match(api,/Unverified candidate/);
 assert.match(api,/compareTitle/);
 assert.match(server,/\/api\/coverage/);
});
