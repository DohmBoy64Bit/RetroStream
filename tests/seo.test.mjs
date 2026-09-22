import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('document head ships useful default search and social metadata', async () => {
  const html = await fs.readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /<meta name="description"[^>]*content="[^"]*RetroStream[^"]*"/s);
  assert.match(html, /<meta name="robots" content="index, follow, max-image-preview:large/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /name="twitter:card"/);
  assert.doesNotMatch(html, /name="keywords"/i);
});

test('primary navigation uses crawlable paths rather than fragment routes', async () => {
  const html = await fs.readFile(new URL('index.html', root), 'utf8');
  for (const href of ['/', '/movies', '/series', '/new']) {
    assert.match(html, new RegExp(`href="${href.replace('/', '\\/')}"`));
  }
  assert.doesNotMatch(html, /href="#(?:home|browse|latest|title|watch|search)/);
});

test('client router uses History API and route-aware SEO metadata', async () => {
  const source = await fs.readFile(new URL('src/app/retrostream.js', root), 'utf8');
  assert.match(source, /parseRoute\(location\.pathname,location\.search\)/);
  assert.match(source, /window\.addEventListener\('popstate',route\)/);
  assert.match(source, /history\[['"]?replaceState['"]?\|'pushState'|history\[replace\?'replaceState':'pushState'\]/);
  assert.match(source, /setPageSeo\(/);
  assert.match(source, /mediaSchema\(/);
  assert.doesNotMatch(source, /window\.addEventListener\('hashchange'/);
});

test('Vercel serves clean SPA routes and SEO endpoints', async () => {
  const config = JSON.parse(await fs.readFile(new URL('vercel.json', root), 'utf8'));
  const rewrites = new Map((config.rewrites ?? []).map(item => [item.source, item.destination]));
  assert.equal(rewrites.get('/robots.txt'), '/api/robots');
  assert.equal(rewrites.get('/sitemap.xml'), '/api/sitemap');
  for (const route of ['/movies', '/series', '/new', '/search']) {
    assert.equal(rewrites.get(route), '/index.html');
  }
  assert.equal(rewrites.get('/movie/:path*'), '/index.html');
  assert.equal(rewrites.get('/series/:path*'), '/index.html');
  assert.equal(rewrites.get('/watch/:path*'), '/index.html');
});
