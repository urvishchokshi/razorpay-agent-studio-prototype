import {readdir,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir=fileURLToPath(new URL('../dist/',import.meta.url));
const files=await readdir(dir);
for(const name of files.filter(x=>x.endsWith('.js')))execFileSync(process.execPath,['--check',dir+name]);
const html=await readFile(dir+'index.html','utf8');
for(const asset of [...html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)].map(m=>m[1]))await readFile(dir+asset);
console.log(`Validated ${files.filter(x=>x.endsWith('.js')).length} JavaScript modules and all entry assets.`);
