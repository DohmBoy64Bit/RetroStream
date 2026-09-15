import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('root UI is a Vite HTML entry owned by the vanilla client', async () => {
  const html = await fs.readFile(new URL('index.html', root), 'utf8');
  assert.match(html, /<html[^>]*data-theme="retrostream"/);
  assert.match(html, /<main id="main" tabindex="-1">/);
  assert.match(html, /<script type="module" src="\/src\/main\.js"><\/script>/);
  await assert.rejects(fs.access(new URL('app/page.tsx', root)));
  await assert.rejects(fs.access(new URL('app/layout.tsx', root)));
});

test('client entry owns styles and starts the watch controller once', async () => {
  const entry = await fs.readFile(new URL('src/main.js', root), 'utf8');
  assert.match(entry, /import ['"]\.\/styles\.css['"]/);
  assert.match(entry, /import ['"]\.\/watch-states\.css['"]/);
  assert.match(entry, /import ['"]\.\/app\/watch-player\.js['"]/);
});
