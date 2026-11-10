import test from 'node:test';
import assert from 'node:assert/strict';
import {topicTerms,compareTitle,parseGoogleCandidates,rankCandidates} from '../api/coverage.js';
test('Dutch stopwords removed; similar titles require two non-generic keywords',()=>{
 const a=topicTerms('Kabinet wil meer woningen bouwen in Limburg');
 assert.ok(a.includes('woningen')&&a.includes('limburg'));
 assert.ok(compareTitle('Woningbouw Limburg locaties','Nieuwe woningbouw in Limburg vandaag').candidate);
 assert.ok(!compareTitle('Woningbouw Limburg locaties','Europese voetbalnieuws en wedstrijden').candidate);
});
test('Google headline results remain unverified and linked to provider',()=>{
 const xml='<rss><item><title>Woningbouw in Limburg nieuwe locaties - NOS</title><link>https://news.google.com/rss/articles/abc</link><source url="https://nos.nl">NOS</source><pubDate>Tue, 10 Nov 2026 10:00:00 GMT</pubDate></item></rss>';
 const data=parseGoogleCandidates(xml,'Nieuwe woningbouw in Limburg','Dutch');
 assert.equal(data.length,1);
 assert.equal(data[0].source,'NOS');assert.match(data[0].verification,/Unverified/);
});
test('candidate rank removes known article URLs without claiming article agreement',()=>{
 const x={url:'https://nos.nl/artikel/123',title:'Kabinet kiest nieuwe locaties woningbouw',source:'NOS',when:'2026-11-10'};
 const scores=rankCandidates('Nieuwe locaties woningbouw kabinet',[x,{...x,url:'https://www.nrc.nl/a'}],['https://nos.nl/artikel/123']);
 assert.equal(scores.length,1);assert.match(scores[0].verification,/Unverified/);
});
