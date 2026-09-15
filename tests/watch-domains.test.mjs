import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WATCH_DOMAINS,
  buildWatchUrl,
  resolveWatchDomain,
} from '../src/app/watch-domains.js';

test('keeps dohmwatch primary and preserves the requested fallback order', () => {
  assert.deepEqual(WATCH_DOMAINS, [
    'https://dohmwatch.com',
    'https://vidsrc2.ru',
    'https://vidsrc.ir',
    'https://vidsrcme.ru',
    'https://vidsrcme.su',
    'https://vidsrc-me.ru',
    'https://vidsrc-me.su',
    'https://vidsrc-embed.ru',
    'https://vidsrc-embed.su',
    'https://vsrc.su',
  ]);
});

test('builds the same VidSrc movie and TV paths on any watch domain', () => {
  assert.equal(
    buildWatchUrl('https://dohmwatch.com', 'movie', 'tt1300854'),
    'https://dohmwatch.com/embed/movie/tt1300854?autoplay=0',
  );
  assert.equal(
    buildWatchUrl('https://vidsrcme.ru', 'tv', 'tt0944947', 2, 3),
    'https://vidsrcme.ru/embed/tv/tt0944947/2/3?autoplay=0',
  );
});

test('uses the primary domain without probing backups when it is reachable', async () => {
  const seen = [];
  const result = await resolveWatchDomain(
    { type: 'movie', imdb: 'tt1300854' },
    { probe: async url => { seen.push(url); return true; } },
  );
  assert.equal(result.index, 0);
  assert.equal(result.domain, 'https://dohmwatch.com');
  assert.equal(seen.length, 1);
});

test('falls through to the first reachable backup in domain order', async () => {
  const reachable = new Set(['https://vidsrc.ir']);
  const result = await resolveWatchDomain(
    { type: 'movie', imdb: 'tt1300854' },
    {
      batchSize: 3,
      probe: async url => reachable.has(new URL(url).origin),
    },
  );
  assert.equal(result.index, 2);
  assert.equal(result.domain, 'https://vidsrc.ir');
});

test('tries a different domain after the current one, then wraps once', async () => {
  const reachable = new Set(['https://dohmwatch.com']);
  const result = await resolveWatchDomain(
    { type: 'tv', imdb: 'tt0944947', season: 1, episode: 1 },
    {
      afterIndex: 4,
      batchSize: 3,
      probe: async url => reachable.has(new URL(url).origin),
    },
  );
  assert.equal(result.index, 0);
  assert.equal(result.domain, 'https://dohmwatch.com');
});

test('returns null when every watch domain is unreachable', async () => {
  const result = await resolveWatchDomain(
    { type: 'movie', imdb: 'tt1300854' },
    { probe: async () => false },
  );
  assert.equal(result, null);
});
