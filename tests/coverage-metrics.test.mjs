import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {extractFeedImage} from '../api/news.js';
import {safePublisherImage,makePreview} from '../api/article-preview.js';

const window={};runInNewContext(await readFile(new URL('../coverage-metrics.js',import.meta.url),'utf8'),{window});
const c=window.OpenLensCoverage,article=name=>({name}),source=a=>a.name;
const lookup=name=>({'A':'Left','B':'Lean Left','C':'Center','D':'Right','E':'Lean Right','X':'Unrated','Institution':'Other source'}[name]?
 {rating:{A:'Left',B:'Lean Left',C:'Center',D:'Right',E:'Lean Right',X:'Unrated',Institution:'Other source'}[name]}:null);
test('only distinct rated publishers enter spectrum percentage denominator',()=>{
 const m=c.summarize(['A','A','B','D','X','Institution'].map(article),source,lookup);
 assert.equal(m.total,5);assert.equal(m.rated,3);
 assert.deepEqual(JSON.parse(JSON.stringify(m.counts)),{left:2,center:0,right:1,unrated:1,other:1});
 assert.deepEqual(JSON.parse(JSON.stringify(m.shares)),{left:67,center:0,right:33});
});
test('no assessed sources is not labeled as center coverage',()=>{
 const m=c.summarize([article('X'),article('Institution')],source,lookup);
 assert.equal(m.rated,0);
 assert.deepEqual(Object.values(m.shares),[0,0,0]);
 assert.equal(c.assessBlindspot(m,2).type,'classification');
});
test('sample caveats require more than one rated publisher for perspective gaps',()=>{
 const onlyLeft=c.summarize(['A','B','C'].map(article),source,lookup);
 assert.equal(c.assessBlindspot(onlyLeft,3).side,'right');
 const sparse=c.summarize(['A'].map(article),source,lookup);
 assert.equal(c.assessBlindspot(sparse,1).type,'sampling');
});
test('publisher metadata image is only a valid public HTTPS URL',()=>{
 assert.equal(safePublisherImage('/image.jpg','https://publisher.example.nl/story'),'https://publisher.example.nl/image.jpg');
 assert.equal(safePublisherImage('http://example.org/x.jpg','https://publisher.example.nl/story'),null);
 assert.equal(safePublisherImage('https://127.0.0.1/private','https://publisher.example.nl/story'),null);
 const html='<meta property="og:image" content="/images/story.jpg"><meta name="description" content="A sufficiently detailed publisher description of this reporting and its original source and details.">';
 assert.equal(makePreview(html,'https://publisher.example.nl/story').imageUrl,'https://publisher.example.nl/images/story.jpg');
});
test('feed image extraction only accepts direct HTTPS image metadata',()=>{
 const example='<item><media:thumbnail url="https://images.publisher.example.nl/story.jpg"/></item>';
 assert.equal(extractFeedImage(example),'https://images.publisher.example.nl/story.jpg');
 assert.equal(extractFeedImage('<enclosure url="https://example.nl/file.mp3" type="audio/mpeg"/>'),null);
});
