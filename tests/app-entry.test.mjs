import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('root UI is an App Router page, not a root route handler', async () => {
  const page = await fs.readFile(new URL('app/page.tsx', root), 'utf8');
  assert.match(page, /export default function Home/);
  assert.match(page, /id="main"/);
  assert.match(page, /src="\/watch-player\.js"/);
  await assert.rejects(fs.access(new URL('app/route.js', root)));
});
