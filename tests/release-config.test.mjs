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

test('CSS build resolves file URLs with Windows-safe paths', async () => {
  const source = await fs.readFile(new URL('scripts/build-css.mjs', root), 'utf8');
  assert.match(source, /fileURLToPath/);
  assert.doesNotMatch(source, /\.pathname/);
});

test('Vinext Worker entry is configured for Cloudflare dev routing', async () => {
  const wrangler = await fs.readFile(new URL('wrangler.jsonc', root), 'utf8');
  assert.match(wrangler, /"main"\s*:\s*"vinext\/server\/fetch-handler"/);
});

test('Vite excludes the Cloudflare runtime module from client dependency pre-bundling', async () => {
  const source = await fs.readFile(new URL('vite.config.ts', root), 'utf8');
  assert.match(source, /optimizeDeps\s*:\s*\{/);
  assert.match(source, /exclude\s*:\s*\[[^\]]*["']cloudflare:workers["']/s);
});
