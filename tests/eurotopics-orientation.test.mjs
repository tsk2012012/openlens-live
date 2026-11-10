import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('Eurotopics profiles cite exact publisher assessments with restricted crosswalk',async()=>{
 const bias=await read('bias-extension.js');
 for(const name of ['de telegraaf','de volkskrant','de groene amsterdammer','de morgen','nrc','trouw','ad nl','politico eu'])assert.ok(bias.includes('"'+name+'"'),name);
 assert.match(bias,/window\.OpenLensPublisherOrientationLookup/);
 assert.match(bias,/provider:'Eurotopics'/);
 assert.match(bias,/methodologies are not directly equivalent/);
 const one=bias.match(/const europeanOrientationProfiles=Object\.freeze\((\{[^\n]*\})\)/);
 assert.ok(one,'Profile registry should remain inspectable');
 const p=JSON.parse(one[1]);
 assert.equal(p['de telegraaf'].mapped,'Right');
 assert.equal(p['de volkskrant'].mapped,'Lean Left');
 assert.equal(p['de groene amsterdammer'].mapped,'Left');
 assert.equal(p['trouw'].mapped,null);
 assert.equal(p['nrc'].mapped,null);
 assert.equal(p['ad nl'].mapped,null);
 assert.ok(p['de telegraaf'].source.startsWith('https://www.eurotopics.net/'));
});
test('source directory presents raw nuanced orientation without implying center',async()=>{
 const pub=await read('publisher-directory.js');
 assert.match(pub,/Eurotopics:/);
 assert.match(pub,/eurotopics\\\.net/);
 assert.match(pub,/A Eurotopics editorial-orientation profile/);
});
