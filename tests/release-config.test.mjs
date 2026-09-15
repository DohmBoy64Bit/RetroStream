import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('pnpm 11 build-script allowlist covers the remaining native toolchain', async () => {
  const yaml = await fs.readFile(new URL('pnpm-workspace.yaml', root), 'utf8');
  assert.match(yaml, /^allowBuilds:\s*$/m);
  for (const dependency of ['esbuild', 'sharp', 'workerd']) {
    assert.match(yaml, new RegExp(`^\\s{2}${dependency}: true\\s*$`, 'm'));
  }
});

test('Vite is the only frontend runtime and Cloudflare integration', async () => {
  const source = await fs.readFile(new URL('vite.config.ts', root), 'utf8');
  assert.match(source, /plugins\s*:\s*\[\s*cloudflare\(\)\s*\]/s);
  assert.doesNotMatch(source, /vinext|plugin-react|plugin-rsc|viteEnvironment|optimizeDeps/);
});

test('package removes React and Vinext and uses native Vite lifecycle scripts', async () => {
  const pkg = JSON.parse(await fs.readFile(new URL('package.json', root), 'utf8'));
  const allDeps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  for (const dependency of ['react', 'react-dom', 'react-server-dom-webpack', 'next', 'vinext', '@vitejs/plugin-react', '@vitejs/plugin-rsc']) {
    assert.equal(allDeps[dependency], undefined, `${dependency} should not be installed`);
  }
  assert.equal(pkg.scripts.dev, 'vite --port 5173');
  assert.equal(pkg.scripts.build, 'vite build');
  assert.match(pkg.scripts.preview, /vite preview/);
});

test('Wrangler routes API requests to the Worker and static navigation to the SPA', async () => {
  const wrangler = await fs.readFile(new URL('wrangler.jsonc', root), 'utf8');
  assert.match(wrangler, /"main"\s*:\s*"\.\/worker\/index\.js"/);
  assert.match(wrangler, /"not_found_handling"\s*:\s*"single-page-application"/);
  assert.match(wrangler, /"run_worker_first"\s*:\s*\[\s*"\/api\/\*"\s*\]/s);
  assert.match(wrangler, /"compatibility_date"\s*:\s*"2026-05-22"/);
});

test('obsolete custom CSS build script is removed', async () => {
  await assert.rejects(fs.access(new URL('scripts/build-css.mjs', root)));
  const postcss = await fs.readFile(new URL('postcss.config.mjs', root), 'utf8');
  assert.match(postcss, /@tailwindcss\/postcss/);
});
