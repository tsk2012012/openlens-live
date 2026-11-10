import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const source=await readFile(new URL('../source-audit.js',import.meta.url),'utf8');
const context={window:{}};
runInNewContext(source,context);
const audit=context.window.OpenLensSourceAudit;
test('audited publisher profiles are attributed, not guessed',()=>{
 for(const [name,expected] of [['Newsweek','Center'],['Financial Times','Center'],['The Atlantic','Left'],['The Washington Post','Lean Left'],['The Bulwark','Left']]){
  const result=audit.lookup(name);
  assert.equal(result.rating,expected);
  assert.match(result.source,/^https:\/\/www\.allsides\.com\/news-source\//);
 }
});
test('known institutional publishers are not treated as journalism',()=>{
 for(const source of ['Tweede Kamer','European Commission','UNRWA','NASA (.gov)','UNESCO']){
  const result=audit.lookup(source);
  assert.equal(result.politicallyAssessable,false,source);
  assert.equal(result.rating,null);
 }
});
test('Dutch public news service is recognized without guessing US bias',()=>{
 const nos=audit.lookup('NOS');
 assert.equal(nos.type,'Public-service / nonprofit news');
 assert.equal(nos.rating,null);
});
test('unknown identities and local outlets never inherit national ratings',()=>{
 assert.equal(audit.lookup('Unknown Newsroom Example').type,'Identity review needed');
 assert.equal(audit.lookup('Unknown Newsroom Example').rating,null);
 assert.equal(audit.lookup('WLOX').rating,null);
 assert.equal(audit.lookup('WLOX').type,'Local / regional news');
});
test('browser and server assets are distinct',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const client=await readFile(new URL('../article-preview.js',import.meta.url),'utf8');
 const server=await readFile(new URL('../api/article-preview.js',import.meta.url),'utf8');
 const dev=await readFile(new URL('../dev-server.mjs',import.meta.url),'utf8');
 assert.match(html,/source-audit\.js\?v=/);
 assert.match(client,/Finding the original publisher/);
 assert.match(server,/node:dns\/promises/);
 assert.match(dev,/source-audit\.js/);
});

test('Dutch public-affairs publishers and official primary sources are correctly typed',()=>{
 const expected=[
 ['Rijksoverheid.nl','Government / legislature'],
 ['Centraal Bureau voor de Statistiek | CBS','Government / legislature'],
 ['Algemene Rekenkamer','Government / legislature'],
 ['De Correspondent','News outlet / publisher'],
 ['Follow the Money - Platform voor onderzoeksjournalistiek','News outlet / publisher'],
 ['Binnenlands Bestuur','Trade / specialty publication'],
 ['De Limburger','Local / regional news'],
 ['EUobserver','News outlet / publisher'],
 ['Brusselse Nieuwe','News outlet / publisher'],
 ['Headliner.nl','News aggregator / portal']
 ];
 for(const [name,category] of expected){
  const result=audit.lookup(name);
  assert.equal(result.type,category,name);
  assert.equal(result.rating,null,name);
 }
 assert.equal(audit.lookup('Rijksoverheid.nl').politicallyAssessable,false);
 assert.equal(audit.lookup('Headliner.nl').politicallyAssessable,false);
});
