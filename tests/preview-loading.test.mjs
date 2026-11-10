import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('preview is informative without a permanent spinner',async()=>{
 const js=await readFile(new URL('../article-preview.js',import.meta.url),'utf8');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(js,/Checking publisher information/);
 assert.doesNotMatch(js,/ol-p-status|ol-p-loading|ol-p-dot|olSpin/);
 assert.match(js,/\.ol-preview-dialog \[hidden\]\{display:none!important\}/);
 assert.match(js,/\$\('ol-p-result'\)\.hidden=false/);
 assert.match(js,/fromGoogle\?'Finding the original publisher/);
 assert.match(html,/article-preview\.js\?v=20261110publisher/);
});
test('browser shows the headline before trying source resolution and keeps a fallback',async()=>{
 const js=await readFile(new URL('../article-preview.js',import.meta.url),'utf8');
 const start=js.indexOf('async function openPreview(');
 const section=js.slice(start,js.indexOf('function makeTrigger(',start));
 assert.ok(section.indexOf('paintPreview(')<section.indexOf('await fetch('));
 assert.match(section,/fromGoogle\?12500:4500/);
 assert.match(section,/Continue through Google News/);
 assert.match(section,/Open original publisher/);
});
