import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLegacyPlayerUrl, rewriteLegacyPlayerMarkup } from '../public/watch-player.js';

test('parses legacy VidSrc movie and TV player URLs into playback details', () => {
  assert.deepEqual(parseLegacyPlayerUrl('https://vidsrc2.ru/embed/movie/tt1300854?autoplay=0'), {
    type: 'movie', imdb: 'tt1300854', season: 1, episode: 1,
  });
  assert.deepEqual(parseLegacyPlayerUrl('https://vidsrc2.ru/embed/tv/tt0944947/2/3?autoplay=0'), {
    type: 'tv', imdb: 'tt0944947', season: 2, episode: 3,
  });
});

test('neutralizes the legacy iframe before it can become the visible player', () => {
  const input = '<iframe class="player" src="https://vidsrc2.ru/embed/movie/tt1300854?autoplay=0" title="Watch"></iframe>';
  const output = rewriteLegacyPlayerMarkup(input);
  assert.match(output, /src="about:blank"/);
  assert.match(output, /data-retrostream-watch-src="https:\/\/vidsrc2\.ru\/embed\/movie\/tt1300854\?autoplay=0"/);
});

test('does not rewrite unrelated markup', () => {
  const input = '<iframe src="https://example.com/embed/thing"></iframe>';
  assert.equal(rewriteLegacyPlayerMarkup(input), input);
});

test('loads the watch controller as the browser entrypoint before the catalog app', async () => {
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /<script type="module" src="\/watch-player\.js" \/>/);
  assert.doesNotMatch(page, /<script type="module" src="\/retrostream\.js"/);
});
