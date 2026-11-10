import test from 'node:test';
import assert from 'node:assert/strict';
import {watchTerms,cleanWatchQuery,parseWatchRss} from '../api/watch.js';
test('watch search requires distinctive keywords and removes uncontrolled operators',()=>{
 assert.equal(cleanWatchQuery('Gaza ceasefire update'),'gaza ceasefire update');
 assert.equal(cleanWatchQuery('de het een'),null);
 assert.equal(cleanWatchQuery('woningtekort AND site:example.com'),'woningtekort site example com');
 assert.equal(cleanWatchQuery('hi'),null);
 assert.equal(cleanWatchQuery('x'.repeat(220)),null);
 assert.ok(watchTerms('Nederland kabinet woningbouw woningbouw').includes('woningbouw'));
});
test('watch feed uses publisher attribution and links from Google RSS',()=>{
 const xml='<rss><channel><item><title>Woningbouw besluit - NOS</title><link>https://news.google.com/rss/articles/abc</link><pubDate>Tue, 10 Nov 2026 11:00:00 GMT</pubDate><source url="https://nos.nl">NOS</source></item></channel></rss>';
 const parsed=parseWatchRss(xml,'Dutch / Netherlands');
 assert.equal(parsed.length,1);
 assert.equal(parsed[0].source,'NOS');
 assert.equal(parsed[0].title,'Woningbouw besluit');
 assert.equal(parsed[0].when,'2026-11-10T11:00:00.000Z');
 assert.equal(parsed[0].discovery,'story-watch-search');
});

test('government and public-affairs terms are valid watch keywords',()=>{assert.equal(cleanWatchQuery('woningbouw kabinet'),'woningbouw kabinet');assert.equal(cleanWatchQuery('Nederland Europese Commissie'),'nederland europese commissie');});
