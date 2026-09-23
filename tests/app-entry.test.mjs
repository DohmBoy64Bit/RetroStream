import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('root UI is a Vite HTML entry owned by the vanilla client', async () => {
  const html = await fs.readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /<html[^>]*data-theme="retrostream"/);
  assert.match(html, /<main id="main" tabindex="-1">/);
  assert.doesNotMatch(html, /<main[^>]*aria-live=/);
  assert.match(html, /<script type="module" src="\/src\/main\.js"><\/script>/);
  await assert.rejects(fs.access(new URL('app/page.tsx', root)));
  await assert.rejects(fs.access(new URL('app/layout.tsx', root)));
});

test('critical application styles load from the document head before JavaScript', async () => {
  const html = await fs.readFile(new URL('index.html', root), 'utf8');
  const criticalIndex = html.indexOf('href="/src/critical.css"');
  const stylesIndex = html.indexOf('href="/src/styles.css"');
  const watchStylesIndex = html.indexOf('href="/src/watch-states.css"');
  const scriptIndex = html.indexOf('src="/src/main.js"');

  assert.ok(criticalIndex > -1, 'critical first-paint CSS should be linked from <head>');
  assert.ok(stylesIndex > -1, 'RetroStream stylesheet should be linked from <head>');
  assert.ok(watchStylesIndex > -1, 'watch-state stylesheet should be linked from <head>');
  assert.ok(criticalIndex < scriptIndex, 'critical CSS must be discovered before the app module');
  assert.ok(stylesIndex < scriptIndex, 'primary CSS must be discovered before the app module');
  assert.ok(watchStylesIndex < scriptIndex, 'watch CSS must be discovered before the app module');
});

test('client entry starts application logic without discovering critical CSS late', async () => {
  const entry = await fs.readFile(new URL('src/main.js', root), 'utf8');
  assert.doesNotMatch(entry, /critical\.css|styles\.css|watch-states\.css/);
  assert.match(entry, /import ['"]\.\/app\/watch-player\.js['"]/);
});

test('route loading reserves the viewport so the footer cannot jump into view', async () => {
  const css = await fs.readFile(new URL('src/critical.css', root), 'utf8');
  assert.match(css, /body\s*>\s*main\s*>\s*\.loading-screen\s*\{[^}]*min-height:/s);
  assert.match(css, /100svh\s*-\s*84px/);
  assert.match(css, /100svh\s*-\s*64px\s*-\s*env\(safe-area-inset-top\)/);
});

test('finished pages reveal as one surface and respect reduced motion', async () => {
  const css = await fs.readFile(new URL('src/critical.css', root), 'utf8');
  assert.match(css, /body\s*>\s*main\s*>\s*:not\(\.loading-screen\)\s*\{[^}]*animation:/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none/);
});


test('search updates results in place and uses a calm mobile debounce', async () => {
  const app = await fs.readFile(new URL('src/app/retrostream.js', root), 'utf8');
  assert.match(app, /history\.replaceState\(null,'',withParams\('\/search',q\)\)/);
  assert.match(app, /setTimeout\(\(\)=>refreshSearch\(false\),350\)/);
  assert.doesNotMatch(app, /value\.trim\(\)\.length>=2\)update\(true\)/);
  assert.match(app, /role="status" aria-live="polite" aria-atomic="true" id="summary"/);
});

test('mobile search progressively discloses advanced filters', async () => {
  const app = await fs.readFile(new URL('src/app/retrostream.js', root), 'utf8');
  const css = await fs.readFile(new URL('src/styles.css', root), 'utf8');
  assert.match(app, /id="filter-toggle" aria-expanded="false" aria-controls="advanced-filters"/);
  assert.match(app, /id="advanced-filters"/);
  assert.match(css, /\.search-page \.search-advanced-filters\{[\s\S]*display:none/);
  assert.match(css, /\.search-page \.search-filters\.filters-open \.search-advanced-filters\{display:grid\}/);
  assert.doesNotMatch(css, /\.search-page \.search-form \.btn\{padding-inline:14px\}/);
});
