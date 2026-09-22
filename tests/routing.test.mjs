import test from 'node:test';
import assert from 'node:assert/strict';
import {
  browsePath,
  legacyHashToUrl,
  parseRoute,
  slugify,
  titlePath,
  watchPath,
  withParams,
} from '../src/app/routing.js';

test('builds readable crawlable catalog URLs', () => {
  assert.equal(browsePath('movie'), '/movies');
  assert.equal(browsePath('tv'), '/series');
  assert.equal(slugify('Spider-Man: Across the Spider-Verse'), 'spider-man-across-the-spider-verse');
  assert.equal(titlePath('movie', 569094, 'Spider-Man: Across the Spider-Verse'), '/movie/569094/spider-man-across-the-spider-verse');
  assert.equal(titlePath('tv', 1402, 'The Walking Dead'), '/series/1402/the-walking-dead');
  assert.equal(watchPath('tv', 1402, 2, 3), '/watch/tv/1402/2/3');
  assert.equal(withParams('/movies', { genre: '28', year: '2026' }), '/movies?genre=28&year=2026');
});

test('parses public History API routes into the existing application route model', () => {
  assert.deepEqual(parseRoute('/').parts, ['home']);
  assert.deepEqual(parseRoute('/movies').parts, ['browse', 'movie']);
  assert.deepEqual(parseRoute('/series').parts, ['browse', 'tv']);
  assert.deepEqual(parseRoute('/new').parts, ['latest']);
  assert.deepEqual(parseRoute('/search', '?q=Alien&type=all').parts, ['search']);
  assert.deepEqual(parseRoute('/movie/348/alien').parts, ['title', 'movie', '348']);
  assert.deepEqual(parseRoute('/series/66732/stranger-things').parts, ['title', 'tv', '66732']);
  assert.deepEqual(parseRoute('/watch/tv/66732/1/2').parts, ['watch', 'tv', '66732', '1', '2']);
  assert.equal(parseRoute('/not-a-real-route').parts, null);
});

test('migrates legacy hash URLs without breaking existing shared links', () => {
  assert.equal(legacyHashToUrl('#home'), '/');
  assert.equal(legacyHashToUrl('#browse/movie?genre=28'), '/movies?genre=28');
  assert.equal(legacyHashToUrl('#browse/tv'), '/series');
  assert.equal(legacyHashToUrl('#latest'), '/new');
  assert.equal(legacyHashToUrl('#search?q=Alien&type=all'), '/search?q=Alien&type=all');
  assert.equal(legacyHashToUrl('#title/movie/348'), '/movie/348');
  assert.equal(legacyHashToUrl('#watch/tv/66732/1/2'), '/watch/tv/66732/1/2');
});
