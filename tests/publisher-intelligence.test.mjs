import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const json=JSON.parse(await readFile(new URL('../publisher-profiles.json',import.meta.url),'utf8'));
const code=await readFile(new URL('../publisher-profiles.js',import.meta.url),'utf8');

test('all reviewed identities are unique, sourced, and explicitly unscored',()=>{
 assert.ok(json.profiles.length>=35);
 const ids=new Set(),keys=new Set(),domains=new Set();
 for(const p of json.profiles){
  assert.ok(p.name&&p.id&&p.country&&p.language);
  assert.equal(p.politicalRating,null,'ownership must not imply a political rating');
  assert.match(p.ownershipSource,/^https:\/\//);
  assert.match(p.verifiedAt,/^2026-\d\d-\d\d$/);
  assert.ok(!ids.has(p.id),'duplicate publisher ID '+p.id);ids.add(p.id);
  for(const a of [p.name,...p.aliases]){
   const k=a.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
   assert.ok(!keys.has(k),'duplicate publisher alias '+k);keys.add(k);
  }
  for(const domain of p.domains){
   assert.ok(!domains.has(domain),'domain collision '+domain);domains.add(domain);
   assert.match(domain,/^[a-z0-9.-]+\.[a-z]{2,}$/);
  }
 }
});

test('name, brand alias, and original domain resolve without substring guesses',async()=>{
 const listeners=[];
 const sandbox={
  window:{}, URL, Event:class Event{constructor(type){this.type=type}},
  document:{dispatchEvent(ev){for(const fn of listeners)fn(ev)}},
  fetch:async()=>({ok:true,json:async()=>json})
 };
 const ready=new Promise(resolve=>listeners.push(ev=>{if(ev.type==='openlens:profiles-ready')resolve()}));
 vm.runInNewContext(code,sandbox);
 await ready;
 const lookup=sandbox.window.OpenLensPublisherProfiles.lookup;
 assert.equal(lookup('AD.nl')?.name,'AD');
 assert.equal(lookup('https://www.volkskrant.nl/nieuws/')?.name,'de Volkskrant');
 assert.equal(lookup({source:'POLITICO.eu',url:'https://news.google.com/articles/xyz'})?.name,'POLITICO Europe');
 assert.equal(lookup('NOS Nieuws')?.owner,'Nederlandse publieke omroep (taakomroep NOS)');
 assert.equal(lookup('Reuters'),null,'unreviewed sources must stay unreviewed');
 assert.equal(lookup('very-nrc-example.nl'),null,'do not use substring domain matches');
 assert.equal(lookup('Fake AD.nl Newspaper'),null,'do not use substring alias matches');
 assert.equal(sandbox.window.OpenLensPublisherProfiles.loaded,true);
 assert.ok(sandbox.window.OpenLensPublisherProfiles.profiles.every(x=>x.politicalRating===null));
});

test('source ratings and ownership use separate scoring systems',async()=>{
 const bias=await readFile(new URL('../bias-extension.js',import.meta.url),'utf8');
 const bar=await readFile(new URL('../newsroom-visuals.js',import.meta.url),'utf8');
 assert.ok(bias.includes("if(eu)return {rating:'Unrated'"),'Eurotopics must not be converted into AllSides bins');
 assert.ok(bar.includes("if(n<3||n/Math.max(1,all)<0.5)"),'insufficient sample must not show 100% political certainty');
});
