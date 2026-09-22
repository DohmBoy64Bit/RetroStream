import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleRobotsRequest, handleSitemapRequest, handleTmdbRequest } from '../worker/index.js';

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

test('robots endpoint allows the site, blocks API crawling, and advertises the sitemap', async () => {
  const response = handleRobotsRequest(new Request('https://retrostream.test/robots.txt'));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/plain/);
  const body = await response.text();
  assert.match(body, /User-agent: \*/);
  assert.match(body, /Allow: \/$/m);
  assert.match(body, /Disallow: \/api\//);
  assert.match(body, /Sitemap: https:\/\/retrostream\.test\/sitemap\.xml/);
});

test('sitemap contains canonical discovery routes without requiring TMDB', async () => {
  const response = await handleSitemapRequest(
    new Request('https://retrostream.test/sitemap.xml'),
    {},
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/xml/);
  const body = await response.text();
  for (const path of ['/', '/movies', '/series', '/new']) {
    assert.match(body, new RegExp(`<loc>https://retrostream\\.test${path === '/' ? '\\/' : path.replaceAll('/', '\\/')}</loc>`));
  }
  assert.doesNotMatch(body, /\/search|\/watch\//);
});

test('sitemap adds popular movie and series URLs when the catalog token is available', async () => {
  const fetchImpl = async url => {
    const pathname = new URL(url).pathname;
    if (pathname.endsWith('/movie/popular')) {
      return Response.json({ results: [{ id: 348, title: 'Alien', adult: false }] });
    }
    return Response.json({ results: [{ id: 66732, name: 'Stranger Things', adult: false }] });
  };
  const response = await handleSitemapRequest(
    new Request('https://retrostream.test/sitemap.xml'),
    { TMDB_READ_TOKEN: 'token' },
    fetchImpl,
  );
  const body = await response.text();
  assert.match(body, /https:\/\/retrostream\.test\/movie\/348\/alien/);
  assert.match(body, /https:\/\/retrostream\.test\/series\/66732\/stranger-things/);
});

