import { cp, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// `tsc` only emits .ts output, so the resources that lived on the Spring classpath
// (application.yml, import.sql, banner.txt and the static client) are copied alongside it.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'src', 'resources');
const to = resolve(root, 'dist', 'resources');

await mkdir(to, { recursive: true });
await cp(from, to, { recursive: true });
console.log(`copied resources -> ${to}`);
