/* Durable PostgreSQL storage. Configured only when DATABASE_URL exists.
 * No political position is inferred or assigned in this persistence layer.
 */
import {randomUUID} from 'node:crypto';
import {dedupeBatch} from './news-normalize.js';
export const databaseConfigured=()=>Boolean(process.env.DATABASE_URL&&/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL));
let clientPromise;
export async function database(){
 if(!databaseConfigured())throw new Error('database_not_connected');
 if(!clientPromise)clientPromise=import('@neondatabase/serverless')
  .then(({neon})=>neon(process.env.DATABASE_URL))
  .catch(e=>{clientPromise=null;throw e});
 return clientPromise;
}
export async function ensureSchema(sql){
 await sql`CREATE TABLE IF NOT EXISTS ol_publishers (
   publisher_key TEXT PRIMARY KEY,
   display_name TEXT NOT NULL,
   observed_domain TEXT,
   first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`;
 await sql`CREATE TABLE IF NOT EXISTS ol_articles (
   url TEXT PRIMARY KEY,
   publisher_key TEXT NOT NULL REFERENCES ol_publishers(publisher_key),
   title TEXT NOT NULL,
   publisher_name TEXT NOT NULL,
   provider TEXT NOT NULL,
   language TEXT,
   image_url TEXT,
   published_at TIMESTAMPTZ,
   indexed_at TIMESTAMPTZ,
   date_type TEXT NOT NULL,
   first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 )`;
 await sql`CREATE TABLE IF NOT EXISTS ol_article_topics (
   article_url TEXT NOT NULL REFERENCES ol_articles(url) ON DELETE CASCADE,
   topic TEXT NOT NULL,
   region TEXT NOT NULL CHECK(region IN ('nl','eu','world')),
   first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   PRIMARY KEY(article_url,topic)
 )`;
 await sql`CREATE TABLE IF NOT EXISTS ol_ingest_runs (
   id TEXT PRIMARY KEY,
   started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   finished_at TIMESTAMPTZ,
   status TEXT NOT NULL CHECK(status IN ('running','completed','partial','failed')),
   requested_topics INTEGER NOT NULL DEFAULT 0,
   successful_topics INTEGER NOT NULL DEFAULT 0,
   records_received INTEGER NOT NULL DEFAULT 0,
   saved_records INTEGER NOT NULL DEFAULT 0,
   source_failures INTEGER NOT NULL DEFAULT 0
 )`;
 await sql`CREATE INDEX IF NOT EXISTS ol_articles_recent_idx ON ol_articles (published_at DESC, indexed_at DESC)`;
 await sql`CREATE INDEX IF NOT EXISTS ol_article_topics_topic_idx ON ol_article_topics (topic,region)`;
 await sql`CREATE INDEX IF NOT EXISTS ol_ingest_recent_idx ON ol_ingest_runs (started_at DESC)`;
}
export async function beginRun(sql,requestedTopics){
 const id=randomUUID();
 await sql`INSERT INTO ol_ingest_runs(id,status,requested_topics)
  VALUES(${id},'running',${requestedTopics})`;
 return id;
}
export async function finishRun(sql,id,report){
 await sql`UPDATE ol_ingest_runs
  SET finished_at=NOW(), status=${report.status},
  successful_topics=${report.successfulTopics},
  records_received=${report.recordsReceived},
  saved_records=${report.savedRecords},
  source_failures=${report.sourceFailures}
  WHERE id=${id}`;
}
export async function saveBatch(sql,topic,articles){
 const normalized=dedupeBatch(articles,topic).slice(0,500);
 if(!normalized.length)return {received:(articles||[]).length,saved:0};
 const publisherMap=new Map();
 for(const a of normalized)if(!publisherMap.has(a.publisherKey))publisherMap.set(a.publisherKey,{
  publisher_key:a.publisherKey,display_name:a.publisherName,observed_domain:a.publisherDomain
 });
 const publishersJson=JSON.stringify([...publisherMap.values()]);
 await sql`INSERT INTO ol_publishers(publisher_key,display_name,observed_domain)
  SELECT p.publisher_key,p.display_name,p.observed_domain
  FROM jsonb_to_recordset(${publishersJson}::jsonb)
    AS p(publisher_key text,display_name text,observed_domain text)
  ON CONFLICT(publisher_key) DO UPDATE
  SET display_name=EXCLUDED.display_name,
      observed_domain=COALESCE(EXCLUDED.observed_domain,ol_publishers.observed_domain),
      last_seen_at=NOW()`;
 const rowsJson=JSON.stringify(normalized.map(a=>({
  url:a.url,title:a.title,publisher_key:a.publisherKey,publisher_name:a.publisherName,
  provider:a.provider,language:a.language,image_url:a.imageUrl,date_type:a.dateType,
  published_at:a.publishedAt,indexed_at:a.indexedAt
 })));
 await sql`INSERT INTO ol_articles
  (url,title,publisher_key,publisher_name,provider,language,image_url,date_type,published_at,indexed_at)
  SELECT a.url,a.title,a.publisher_key,a.publisher_name,a.provider,a.language,
    a.image_url,a.date_type,NULLIF(a.published_at,'')::timestamptz,
    NULLIF(a.indexed_at,'')::timestamptz
  FROM jsonb_to_recordset(${rowsJson}::jsonb)
    AS a(url text,title text,publisher_key text,publisher_name text,provider text,
         language text,image_url text,date_type text,published_at text,indexed_at text)
  ON CONFLICT(url) DO UPDATE
  SET last_seen_at=NOW(),
      title=EXCLUDED.title,
      publisher_key=EXCLUDED.publisher_key,
      publisher_name=EXCLUDED.publisher_name,
      provider=EXCLUDED.provider,
      language=EXCLUDED.language,
      image_url=COALESCE(EXCLUDED.image_url,ol_articles.image_url),
      published_at=COALESCE(EXCLUDED.published_at,ol_articles.published_at),
      indexed_at=COALESCE(EXCLUDED.indexed_at,ol_articles.indexed_at),
      date_type=CASE WHEN EXCLUDED.published_at IS NOT NULL THEN EXCLUDED.date_type ELSE ol_articles.date_type END`;
 const joinsJson=JSON.stringify(normalized.map(a=>({article_url:a.url,topic:a.topic,region:a.region})));
 await sql`INSERT INTO ol_article_topics(article_url,topic,region)
  SELECT x.article_url,x.topic,x.region
  FROM jsonb_to_recordset(${joinsJson}::jsonb) AS x(article_url text,topic text,region text)
  ON CONFLICT(article_url,topic) DO UPDATE SET last_seen_at=NOW(),region=EXCLUDED.region`;
 return {received:(articles||[]).length,saved:normalized.length};
}
export async function getStatus(sql){
 const [totals]=await sql`SELECT
  (SELECT COUNT(*)::int FROM ol_articles) AS articles,
  (SELECT COUNT(*)::int FROM ol_publishers) AS publishers,
  (SELECT COUNT(*)::int FROM ol_article_topics) AS topic_links,
  (SELECT MAX(finished_at) FROM ol_ingest_runs WHERE status IN ('completed','partial')) AS last_success`;
 const recent=await sql`SELECT started_at AS "startedAt",finished_at AS "finishedAt",
  status,requested_topics AS "requestedTopics",successful_topics AS "successfulTopics",
  records_received AS "recordsReceived",saved_records AS "savedRecords",
  source_failures AS "sourceFailures" FROM ol_ingest_runs ORDER BY started_at DESC LIMIT 4`;
 return {...totals,runs:recent};
}
export async function getArticles(sql,topic,days=7,limit=160){
 const rows=await sql`SELECT a.url,a.title,a.publisher_name AS source,
  a.publisher_name AS domain,a.provider,a.language,a.image_url AS "imageUrl",
  t.region,t.topic,a.date_type AS "dateType",
  COALESCE(a.published_at,a.indexed_at) AS "when"
 FROM ol_articles a JOIN ol_article_topics t ON t.article_url=a.url
 WHERE t.topic=${topic} AND
  COALESCE(a.published_at,a.indexed_at,a.last_seen_at)>=NOW()-(${days}::int * INTERVAL '1 day')
 ORDER BY COALESCE(a.published_at,a.indexed_at,a.last_seen_at) DESC
 LIMIT ${Math.min(240,Math.max(1,limit))}`;
 return rows;
}

/* Aggregated observed publisher sample, independent of the curated directory.
 * Unique articles counted once even when associated with several topic searches.
 */
export async function getPublisherStatistics(sql){
 const rows=await sql`SELECT p.publisher_key AS "publisherKey",
 p.display_name AS name,p.observed_domain AS domain,
 COUNT(DISTINCT a.url)::int AS articles,
 COUNT(DISTINCT t.topic)::int AS topics,
 MAX(COALESCE(a.published_at,a.indexed_at,a.last_seen_at)) AS "latestArticleAt",
 MAX(a.last_seen_at) AS "lastObservedAt"
 FROM ol_publishers p
 LEFT JOIN ol_articles a ON a.publisher_key=p.publisher_key
 LEFT JOIN ol_article_topics t ON t.article_url=a.url
 GROUP BY p.publisher_key,p.display_name,p.observed_domain
 ORDER BY COUNT(DISTINCT a.url) DESC,p.display_name ASC LIMIT 2000`;
 const [summary]=await sql`SELECT
 (SELECT COUNT(*)::int FROM ol_articles) AS articles,
 (SELECT COUNT(*)::int FROM ol_publishers) AS publishers,
 (SELECT MAX(finished_at) FROM ol_ingest_runs WHERE status IN ('completed','partial')) AS "lastSuccess",
 (SELECT COUNT(*)::int FROM ol_ingest_runs WHERE status IN ('completed','partial')) AS "completedRuns"`;
 return {summary,publishers:rows};
}
