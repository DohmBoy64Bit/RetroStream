import fs from 'node:fs/promises';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
const from=new URL('../src/styles.css',import.meta.url).pathname;
const result=await postcss([tailwind()]).process(await fs.readFile(from,'utf8'),{from,to:'public/retrostream.css'});
await fs.writeFile(new URL('../public/retrostream.css',import.meta.url),result.css);
