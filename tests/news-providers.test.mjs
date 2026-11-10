import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRss,parseGdelt,gdeltUrl,feedsFor,isOnTopic,combineArticles} from '../api/news-providers.js';
test('publisher original feed provides true publisher source and image metadata',()=>{
 const xml='<item><title>Woningbouwplannen</title><link>https://nos.nl/artikel/123</link><pubDate>Tue, 10 Nov 2026 12:00:00 GMT</pubDate><media:thumbnail url="https://nos.nl/photo.jpg"/></item>';
 const r=parseRss(xml,{name:'NOS',language:'Dutch',domains:['nos.nl']},7,Date.parse('2026-11-10T16:00:00Z'));
 assert.equal(r.length,1);assert.equal(r[0].source,'NOS');assert.equal(r[0].imageUrl,'https://nos.nl/photo.jpg');
});
test('GDELT preserves index versus publication provenance',()=>{
 const r=parseGdelt({articles:[{url:'https://www.telegraaf.nl/news/123',domain:'telegraaf.nl',title:'Kabinet over woningbouw',seendate:'20261110T140000Z',socialimage:'https://images.nl/image.jpg'}]});
 assert.equal(r[0].source,'De Telegraaf');assert.equal(r[0].dateType,'index_seen_time');assert.ok(r[0].imageUrl);
});
test('RSS must contain link on original publisher domain and a valid date',()=>{
 const r=parseRss('<item><title>Foo</title><link>https://example.com/fake</link><pubDate>Tue, 10 Nov 2026 12:00:00 GMT</pubDate></item>',{name:'NOS',language:'Dutch',domains:['nos.nl']});
 assert.equal(r.length,0);
});
test('available feed plans honor requested edition',()=>{
 assert.ok(feedsFor('dutch-politics').length>=2);
 assert.ok(feedsFor('eu-policy').some(x=>x.name==='POLITICO.eu'));
 assert.equal(feedsFor('dutch-politics','Germany').length,0);
 assert.ok(isOnTopic('Woningbouw in Limburg','housing'));
 assert.ok(!isOnTopic('Uitslag voetbal', 'housing'));
 assert.ok(gdeltUrl('housing',7).includes('gdeltproject.org'));
});
test('canonical URL and same-source headline duplicates collapse while preserving image',()=>{
 const r=combineArticles([
 {url:'https://nos.nl/a?utm_source=foo',source:'NOS',title:'Nieuws'},
 {url:'https://nos.nl/a',source:'NOS',title:'Nieuws',imageUrl:'https://nos.nl/photo.jpg'},
 {url:'https://news.google.com/rss/articles/12',source:'NOS',title:'Nieuws'}
 ]);assert.equal(r.length,1);assert.equal(r[0].imageUrl,'https://nos.nl/photo.jpg');
});

test('Dutch and European publishers are requested as original feeds, without forcing a political label',()=>{
 const general=feedsFor('dutch-politics');
 for(const name of ['NOS','NU','NRC','De Telegraaf','de Volkskrant','Trouw','AD.nl'])assert.ok(general.some(f=>f.name===name),name);
 const european=feedsFor('eu-policy');
 for(const name of ['POLITICO.eu','DutchNews.nl','NL Times'])assert.ok(european.some(f=>f.name===name),name);
 assert.ok(!isOnTopic('Sportnieuws uit Amsterdam','dutch-politics'));
 assert.ok(isOnTopic('Debat in de Tweede Kamer','dutch-politics'));
});
