import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('official record panel is installed after Story Watch and preserves old watch persistence',async()=>{
 const html=await read('index.html'),client=await read('official-milestones.js'),server=await read('dev-server.mjs');
 assert.match(html,/official-milestones\.js\?v=/);
 assert.ok(html.indexOf('story-watch.js?v=')<html.indexOf('official-milestones.js?v='));
 assert.match(client,/openlens\.story-watch\.official\.v1/);
 assert.match(client,/openlens\.story-watch\.v1/);
 assert.match(client,/Official parliamentary & EU records/);
 assert.match(client,/relevance to your watched story is only a keyword match/);
 assert.match(client,/data-ol-official-check/);
 assert.match(client,/\/api\/milestones\?/);
 assert.match(server,/official-milestones\.js/);
});
test('no official event can be rendered from a third-party link',async()=>{
 const src=await read('official-milestones.js');
 assert.match(src,/\['gegevensmagazijn\.tweedekamer\.nl','eur-lex\.europa\.eu'\]/);
 assert.match(src,/safeSource\(r\.sourceUrl\)/);
 assert.match(src,/new Set\(\(record\.seen\|\|\[\]\)/);
 assert.match(src,/last check/);
});
