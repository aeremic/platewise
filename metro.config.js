const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle migrations are bundled as .sql files.
config.resolver.sourceExts.push('sql');

// babel-plugin-inline-import inlines each .sql file into drizzle/migrations.js, but Metro caches
// transforms by the importing file only. A stale (e.g. still-empty) migration then ships and
// crashes SQLite natively. Tie the cache to the SQL contents; restart Metro after editing SQL.
const drizzleDir = path.join(__dirname, 'drizzle');
const sqlHash = crypto.createHash('sha1');
for (const file of fs.readdirSync(drizzleDir).filter((f) => f.endsWith('.sql')).sort()) {
  sqlHash.update(file).update(fs.readFileSync(path.join(drizzleDir, file)));
}
config.cacheVersion = `drizzle-${sqlHash.digest('hex')}`;

module.exports = config;
