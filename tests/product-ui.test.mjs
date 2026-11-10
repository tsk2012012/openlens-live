import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('dedicated OpenLens favicon and sidebar brandmark are installed',async()=>{
 const svg=await read('favicon.svg'),html=await read('index.html');
 assert.match(svg,/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.match(svg,/<title>OpenLens<\/title>/);
 assert.match(html,/<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg\?v=/);
 assert.match(html,/ol-brand-logo/);
 assert.doesNotMatch(html,/href="data:image\/svg\+xml/);
});
test('directory and shell load after the existing bias and review services',async()=>{
 const html=await read('index.html');
 const scripts=['source-audit.js','bias-extension.js','editorial-review.js','publisher-directory.js','product-shell.js'];
 const positions=scripts.map(s=>html.indexOf('<script src="'+s));
 assert.ok(positions.every(n=>n>=0));
 for(let i=1;i<positions.length;i++)assert.ok(positions[i]>positions[i-1]);
 const dev=await read('dev-server.mjs');
 assert.match(dev,/favicon\.svg/);
 assert.match(dev,/image\/svg\+xml/);
 assert.match(dev,/publisher-directory\.js/);
 assert.match(dev,/product-shell\.js/);
});
test('advanced tools remain available without dominating primary navigation',async()=>{
 const shell=await read('product-shell.js');
 assert.match(shell,/Advanced research/);
 assert.match(shell,/Research questions/);
 assert.match(shell,/Editorial lab/);
 assert.match(shell,/pub\.dataset\.view='publishers'/);
 assert.match(shell,/nav\.replaceChildren\(heading,dash,pub,saved,guide,more,advanced\)/);
 assert.match(shell,/state\.view==='claims'/);
 assert.match(shell,/state\.view==='reviews'/);
});
test('publisher directory does not infer a Center rating for unassessed sources',async()=>{
 const directory=await read('publisher-directory.js');
 assert.match(directory,/OpenLensSourceAudit/);
 assert.match(directory,/OpenLensPublisherRatingLookup/);
 assert.match(directory,/No independent political rating/);
 assert.match(directory,/Institutional \/ non-news source/);
 assert.match(directory,/Unrated does not mean Center/);
 assert.doesNotMatch(directory,/rating\s*=\s*['"]Center['"]/);
});
