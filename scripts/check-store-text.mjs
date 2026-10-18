#!/usr/bin/env node
// Checks store/listing.md fields against App Store Connect and Google Play character limits.
//   node scripts/check-store-text.mjs
import { readFileSync } from 'node:fs';

const text = readFileSync(new URL('../store/listing.md', import.meta.url), 'utf8');

// "### Heading (≤ N)" followed by the field's text, up to the next heading.
const fields = [...text.matchAll(/^### (.+?) \(≤ (\d+)[^)]*\)\n([\s\S]*?)(?=^#{2,3} |$(?![\s\S]))/gm)];
let failed = false;
for (const [, name, limit, body] of fields) {
  const value = body.trim();
  // Apple and Google count characters, not bytes; use code points.
  const length = [...value].length;
  const ok = length <= Number(limit);
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(28)} ${String(length).padStart(4)} / ${limit}`);
}
if (fields.length === 0) {
  console.error('No fields found.');
  process.exit(1);
}
process.exit(failed ? 1 : 0);
