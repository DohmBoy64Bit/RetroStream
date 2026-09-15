import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('pnpm 11 build-script allowlist is committed', async () => {
  const yaml = await fs.readFile(new URL('pnpm-workspace.yaml', root), 'utf8');
  assert.match(yaml, /^allowBuilds:\s*$/m);
  for (const dependency of ['esbuild', 'sharp', 'workerd']) {
    assert.match(yaml, new RegExp(`^\\s{2}${dependency}: true\\s*$`, 'm'));
  }
});
