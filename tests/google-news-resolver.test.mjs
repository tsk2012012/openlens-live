import test from 'node:test';
import assert from 'node:assert/strict';
import {googleNewsArticleId,googleDecodeParams,googleRpcBody,parseGoogleRpc,resolveGoogleNewsUrl} from '../api/google-news-resolver.js';
const id='CBMiaF9BVV95cUxQb3BlbmxlbnM4c291cmNlbGluaw';
const input='https://news.google.com/rss/articles/'+id+'?oc=5';
const fixtureHtml='<html><c-wiz data-n-a-id="'+id+'" data-n-a-ts="1794200000" data-n-a-sg="abc+/def"></c-wiz></html>';
const fixtureResponse=')]}\\n'.replace('\\\\n','\n')+'[["wrb.fr","Fbv4je","[\\\"garturlres\\\",\\\"https://publisher.example.org/actual-story\\\",1]",null,null,null,"generic"]]';
test('Google link parser rejects non-Google and malformed links',()=>{
 assert.equal(googleNewsArticleId(input),id);
 assert.equal(googleNewsArticleId('https://news.google.com/'),null);
 assert.equal(googleNewsArticleId('https://example.org/rss/articles/'+id),null);
 assert.equal(googleNewsArticleId('http://news.google.com/rss/articles/'+id),null);
});
test('Google RPC request is well formed',()=>{
 const params=googleDecodeParams(fixtureHtml);
 assert.equal(params.ts,1794200000);
 const outer=JSON.parse(new URLSearchParams(googleRpcBody(id,params)).get('f.req'));
 const payload=JSON.parse(outer[0][0][1]);
 assert.equal(outer[0][0][0],'Fbv4je');
 assert.equal(payload[0],'garturlreq');assert.equal(payload[2],id);assert.equal(payload[4],'abc+/def');
});
test('extracts real publisher URL from Google RPC response',()=>{
 const rpc=')]}\\n'.replace('\\\\n','\n')+JSON.stringify([['wrb.fr','Fbv4je',JSON.stringify(['garturlres','https://publisher.example.org/article',1]),null,null,null,'generic']]);
 assert.equal(parseGoogleRpc(rpc),'https://publisher.example.org/article');
});
test('resolves a Google News URL from mocked responses without following unvalidated redirects',async()=>{
 const calls=[];
 const stub=async (url,opts)=>{
  calls.push({url:String(url),method:opts.method,redirect:opts.redirect});
  if(calls.length===1)return new Response(fixtureHtml,{status:200,headers:{'Content-Type':'text/html'}});
  const rpc=')]}\\n'.replace('\\\\n','\n')+JSON.stringify([['wrb.fr','Fbv4je',JSON.stringify(['garturlres','https://publisher.example.org/news/a',1]),null,null,null,'generic']]);
  return new Response(rpc,{status:200,headers:{'Content-Type':'text/plain'}});
 };
 const result=await resolveGoogleNewsUrl(input,{fetchImpl:stub,timeoutMs:800});
 assert.equal(result.originalUrl,'https://publisher.example.org/news/a');
 assert.equal(result.method,'google-news-rpc');
 assert.equal(calls.length,2);assert.equal(calls[0].redirect,'manual');assert.equal(calls[1].method,'POST');
});
test('fails closed when signatures or destinations are absent or unsafe',async()=>{
 await assert.rejects(resolveGoogleNewsUrl(input,{fetchImpl:async()=>new Response('<html>Blocked</html>')}),/redirect metadata/);
 const bad=async(url,opts)=>{
  if(opts.method==='GET')return new Response(fixtureHtml);
  const payload=JSON.stringify([['wrb.fr','Fbv4je',JSON.stringify(['garturlres','http://127.0.0.1/private',1])]]);
  return new Response(")]}'\n"+payload);
 };
 await assert.rejects(resolveGoogleNewsUrl(input,{fetchImpl:bad}),/no publisher HTTPS URL/);
});
