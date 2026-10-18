#!/usr/bin/env node
// Fails if anything that must be filled in before a store release is still a placeholder,
// or if a store build would ship a personal USDA key. Run: npm run release:check
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const problems = [];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

// 1. The placeholder support address in app code, the public website and store texts.
const files = [...walk(join(root, 'src')), ...walk(join(root, 'docs')), ...walk(join(root, 'store'))].filter((f) =>
  /\.(tsx?|html|md|txt|json)$/.test(f),
);
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/replace-me@/i.test(line)) problems.push(`${file.replace(root, '')}:${i + 1}: placeholder support email still present`);
  });
}

// 2. No USDA key may end up in a release build until there is an official one. Expo inlines
// EXPO_PUBLIC_* values from the shell and from these files into local builds.
const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local'];
const env = { ...process.env };
for (const name of envFiles) {
  let text;
  try {
    text = readFileSync(join(root, name), 'utf8');
  } catch {
    continue;
  }
  for (const line of text.split('\n')) {
    const match = /^\s*(?:export\s+)?(EXPO_PUBLIC_[A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (match && match[2].trim() !== '') env[match[1]] = match[2].trim();
  }
}
if (env.EXPO_PUBLIC_USDA_LOOKUP === 'enabled') {
  problems.push('EXPO_PUBLIC_USDA_LOOKUP=enabled is set — USDA Look up is disabled for release until there is an official key.');
}
if (env.EXPO_PUBLIC_FDC_API_KEY) {
  problems.push(`EXPO_PUBLIC_FDC_API_KEY is set (shell or ${envFiles.join('/')}) — comment it out before a release build.`);
}

// 3. App identifiers must match the store listings.
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
if (app.ios?.bundleIdentifier !== 'com.aeremic.platewise') problems.push('app.json ios.bundleIdentifier is not com.aeremic.platewise');
if (app.android?.package !== 'com.aeremic.platewise') problems.push('app.json android.package is not com.aeremic.platewise');

if (problems.length > 0) {
  console.error('Release check failed:\n' + problems.map((p) => `  • ${p}`).join('\n'));
  process.exit(1);
}
console.log('Release check passed.');
