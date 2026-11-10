import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('article preview never displays an obsolete spinner alongside the result',async()=>{
 const js=await readFile(new URL('../article-preview.js',import.meta.url),'utf8');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(js,/Checking publisher information/);
 assert.doesNotMatch(js,/ol-p-status|ol-p-loading|ol-p-dot|olSpin/);
 assert.match(js,/\.ol-preview-dialog \[hidden\]\{display:none!important\}/);
 assert.match(js,/\$\('ol-p-result'\)\.hidden=false/);
 assert.match(js,/if\(googleFeedLink\(url\)\)\{[\s\S]*?return;/);
 assert.match(html,/article-preview\.js\?v=20261110spinnerfix/);
});
test('publisher description checks never delay showing headline',async()=>{
 const js=await readFile(new URL('../article-preview.js',import.meta.url),'utf8');
 const start=js.indexOf('async function openPreview(');
 const section=js.slice(start,js.indexOf('function makeTrigger(',start));
 assert.ok(section.indexOf("paintPreview('Headline available'")<section.indexOf('await fetch('));
 assert.match(section,/setTimeout\(\(\)=>controller\.abort\(\),3200\)/);
});
