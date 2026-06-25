// Dogfood: lint spotlight-api's own openapi.yaml with Spotlight. Fails on errors.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lint } from './engine.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = readFileSync(join(ROOT, 'openapi.yaml'), 'utf8');
const { diagnostics, counts } = await lint(content, { format: 'openapi' });
console.log(`openapi.yaml — ${diagnostics.length} finding(s):`, counts);
if (counts.error > 0) {
  for (const d of diagnostics.filter((x) => x.severity === 'error')) console.error('  error:', d.code, '-', d.message);
  process.exit(1);
}
console.log('selfcheck OK (no errors).');
