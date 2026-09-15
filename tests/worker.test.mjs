import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleTmdbRequest } from '../worker/index.js';

test('Worker only owns API routes and returns 404 for other requests', async () => {
  const response = await worker.fetch(new Request('https://retrostream.test/not-an-api'), {});
  assert.equal(response.status, 404);
});

test('TMDB endpoint rejects unsupported upstream paths before fetching', async () => {
  let fetched = false;
  const response = await handleTmdbRequest(
    new Request('https://retrostream.test/api/tmdb?path=../../secrets'),
    { TMDB_READ_TOKEN: 'token' },
    async () => { fetched = true; return new Response('{}'); },
  );
  assert.equal(response.status, 400);
  assert.equal(fetched, false);
});

test('TMDB endpoint requires a server-side token', async () => {
  const response = await handleTmdbRequest(
    new Request('https://retrostream.test/api/tmdb?path=configuration'),
    {},
    async () => new Response('{}'),
  );
  assert.equal(response.status, 503);
});

test('TMDB proxy forwards only allowed query params and keeps the token server-side', async () => {
  let upstream;
  const response = await handleTmdbRequest(
    new Request('https://retrostream.test/api/tmdb?path=search/movie&query=Alien&page=2&evil=1'),
    { TMDB_READ_TOKEN: 'secret-token' },
    async (url, init) => {
      upstream = { url: new URL(url), init };
      return new Response('{"results":[]}', { status: 200, headers: { 'content-type': 'application/json' } });
    },
  );

  assert.equal(response.status, 200);
  assert.equal(upstream.url.pathname, '/3/search/movie');
  assert.equal(upstream.url.searchParams.get('query'), 'Alien');
  assert.equal(upstream.url.searchParams.get('page'), '2');
  assert.equal(upstream.url.searchParams.get('evil'), null);
  assert.equal(upstream.url.searchParams.get('include_adult'), 'false');
  assert.equal(upstream.init.headers.Authorization, 'Bearer secret-token');
});
