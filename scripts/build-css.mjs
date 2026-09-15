import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const sourceUrl = new URL('../src/styles.css', import.meta.url);
const outputUrl = new URL('../public/retrostream.css', import.meta.url);
const from = fileURLToPath(sourceUrl);
const to = fileURLToPath(outputUrl);
const result = await postcss([tailwind()]).process(await fs.readFile(sourceUrl, 'utf8'), { from, to });
await fs.writeFile(outputUrl, result.css);
