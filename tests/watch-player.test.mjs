import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLegacyPlayerUrl, rewriteLegacyPlayerMarkup } from '../src/app/watch-player.js';

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

test('watch controller remains the catalog bootstrap boundary', async () => {
  const { readFile } = await import('node:fs/promises');
  const entry = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const controller = await readFile(new URL('../src/app/watch-player.js', import.meta.url), 'utf8');
  assert.match(entry, /import ['"]\.\/app\/watch-player\.js['"]/);
  assert.match(controller, /import\(['"]\.\/retrostream\.js['"]\)/);
});
