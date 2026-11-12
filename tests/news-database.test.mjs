import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalNewsUrl,publisherKey,normalizeNewsArticle,dedupeBatch,INGEST_TOPICS,topicRegion} from '../lib/news-normalize.js';
import {databaseConfigured} from '../lib/news-store.js';
import ingest from '../api/ingest.js';
import storageStatus from '../api/storage-status.js';
function mockResponse(){
 return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},end(text){this.body=String(text||'');return this}};
}
test('tracking parameters and URL fragment are removed consistently',()=>{
 assert.equal(canonicalNewsUrl('https://news.example.nl/story?utm_source=reddit&article=1#top'),'https://news.example.nl/story?article=1');
});
test('unsafe and non HTTPS links are ignored',()=>{
 assert.equal(canonicalNewsUrl('http://news.example.com/story'),null);
 assert.equal(canonicalNewsUrl('https://localhost/story'),null);
 assert.equal(canonicalNewsUrl('https://127.0.0.1/story'),null);
});
test('publisher identities are stable across spelling variations',()=>{
 assert.equal(publisherKey('De Volkskrant'),publisherKey('de VOLKSKRANT'));
 assert.equal(publisherKey('Écho'),'echo');
});
test('publisher article dates stay distinguishable from index dates',()=>{
 const base={url:'https://news.example.nl/123',title:'Dutch parliament debates new housing proposal',
  source:'Example publisher',when:'2026-11-10T08:00:00Z'};
 const publisher=normalizeNewsArticle({...base,dateType:'publisher_pubdate'},'netherlands');
 const index=normalizeNewsArticle({...base,dateType:'index_seen_time'},'netherlands');
 assert.equal(publisher.publishedAt,base.when);assert.equal(publisher.indexedAt,null);
 assert.equal(index.publishedAt,null);assert.equal(index.indexedAt,base.when);
 assert.equal(publisher.region,'nl');
});
test('a repeated article in a single import batch is not counted twice',()=>{
 const base={url:'https://news.example.nl/article?utm_medium=social',
  title:'European Parliament negotiates new proposal',source:'Example publisher',
  when:'2026-11-10T08:00:00Z'};
 const result=dedupeBatch([base,{...base,url:'https://news.example.nl/article'}],'europe');
 assert.equal(result.length,1);assert.equal(result[0].region,'eu');
});
test('scheduled topic names are all recognized',()=>{
 assert.equal(INGEST_TOPICS.length,13);
 assert.equal(topicRegion('dutch-politics'),'nl');
 assert.equal(topicRegion('eu-policy'),'eu');
 assert.equal(topicRegion('world'),'world');
});
test('unsecured ingest route rejects requests even without database configuration',async()=>{
 const old=process.env.CRON_SECRET;
 delete process.env.CRON_SECRET;
 try{
  const res=mockResponse();
  await ingest({method:'GET',url:'/api/ingest',headers:{}},res);
  assert.equal(res.statusCode,401);
  assert.equal(JSON.parse(res.body).error,'cron_secret_required');
 }finally{
  if(old===undefined)delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET=old;
 }
});
test('storage status reveals missing DB without leaking any secret',async()=>{
 const old=process.env.DATABASE_URL;
 delete process.env.DATABASE_URL;
 try{
  assert.equal(databaseConfigured(),false);
  const res=mockResponse();
  await storageStatus({method:'GET',url:'/api/storage-status'},res);
  assert.equal(res.statusCode,200);
  assert.equal(JSON.parse(res.body).state,'not_connected');
 }finally{
  if(old===undefined)delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL=old;
 }
});
