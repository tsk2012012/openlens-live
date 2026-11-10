import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDutchUrl,classifyDutch,parseDutchOdata,parseEurlexRss,relevantMilestones} from '../api/milestones.js';
const guid='a12b35c0-aaaa-4bbb-8ccc-100000000001';
test('OData v5 query is bounded, scoped to official domain and current field names',()=>{
 const u=new URL(makeDutchUrl('Activiteit','woningbouw kabinet',30,Date.parse('2026-11-10T13:00:00Z')));
 assert.equal(u.hostname,'gegevensmagazijn.tweedekamer.nl');
 assert.equal(u.pathname,'/OData/v5/Activiteit');
 assert.match(u.searchParams.get('$filter'),/tolower\(Onderwerp\)/);
 assert.match(u.searchParams.get('$filter'),/Verwijderd eq false/);
 assert.ok(Number(u.searchParams.get('$top'))<=100);
 assert.throws(()=>makeDutchUrl('Besluit','woningbouw kabinet'),/Unknown/);
});
test('Dutch activity and case descriptions cannot become verdicts',()=>{
 assert.equal(classifyDutch('Activiteit','Commissiedebat','Gepland').label,'Debate scheduled');
 assert.equal(classifyDutch('Activiteit','Plenair debat (wetgeving)','Uitgevoerd').label,'Debate held');
 assert.equal(classifyDutch('Zaak','Amendement','').label,'Amendment registered');
 assert.match(classifyDutch('Document','Voorstel van wet','').stage,/not enacted/);
});
test('Parliamentary records include direct source links and remove deleted records',()=>{
 const rows=parseDutchOdata({value:[
  {Id:guid,Datum:'2026-11-06T09:00:00Z',Onderwerp:'Debat over woningbouw locaties',Soort:'Commissiedebat',Status:'Gepland',Verwijderd:false},
  {Id:'a12b35c0-aaaa-4bbb-8ccc-100000000002',Datum:'2026-11-06T10:00:00Z',Onderwerp:'Archive',Verwijderd:true}
 ]},'Activiteit');
 assert.equal(rows.length,1);
 assert.match(rows[0].sourceUrl,/gegevensmagazijn\.tweedekamer\.nl\/OData\/v5\/Activiteit/);
 assert.equal(rows[0].label,'Debate scheduled');
});
test('EU proposal RSS is labeled without saying it became law',()=>{
 const rss='<rss><channel><item><title>Proposal for REGULATION on European housing policy</title><link>https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52026PC0123</link><pubDate>Tue, 10 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>';
 const rows=parseEurlexRss(rss,'commission-proposals');
 assert.equal(rows.length,1);
 assert.match(rows[0].stageNote,/not enacted law/);
 assert.equal(rows[0].label,'Commission proposal published');
 assert.ok(rows[0].sourceUrl.startsWith('https://eur-lex.europa.eu/'));
});
test('Official candidate relevance requires matching keywords and reports uncertainty',()=>{
 const rows=parseDutchOdata({value:[
  {Id:guid,Datum:'2026-11-10T08:00:00Z',Onderwerp:'Debat over woningbouw locaties',Soort:'Commissiedebat',Status:'Gepland'}
 ]},'Activiteit');
 const results=relevantMilestones(rows,'woningbouw kabinet',30,Date.parse('2026-11-10T13:00:00Z'));
 assert.equal(results.length,1);
 assert.match(results[0].matchStatus,/unverified/);
 assert.equal(relevantMilestones(rows,'defensie pensioen',30,Date.parse('2026-11-10T13:00:00Z')).length,0);
});
