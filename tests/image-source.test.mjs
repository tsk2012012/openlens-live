import test from 'node:test';
import assert from 'node:assert/strict';
import {safePublisherImage} from '../api/article-preview.js';
test('article image URL cannot be article itself or a publisher consent screen',()=>{
 assert.equal(safePublisherImage('https://nos.nl/artikel/123','https://nos.nl/artikel/123'),null);
 assert.equal(safePublisherImage('https://myprivacy.dpgmedia.nl/consent?siteKey=x','https://ad.nl/news'),null);
 assert.equal(safePublisherImage('https://images.cdn.nos.nl/example.webp','https://nos.nl/artikel/123'),'https://images.cdn.nos.nl/example.webp');
});
