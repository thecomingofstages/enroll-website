#!/bin/bash
# Build script for Cloudflare Pages deployment with @opennextjs/cloudflare.
#
# Steps:
#   1. Run the OpenNext build (produces .open-next/).
#   2. Copy static assets from .open-next/assets/ into .open-next/ so they
#      are deployed alongside the Worker.
#   3. Rename worker.js to _worker.js (Cloudflare Pages convention).
#   4. Generate _routes.json with an "exclude" list that includes every
#      file in public/. This is the critical step:
#
#      By default, the OpenNext build emits a _routes.json that includes
#      "/*" in the include list, which sends every request to the Worker.
#      That includes requests for /public/* files, which the Worker has
#      no handler for — so they 404. Excluding public/* from the Worker
#      route lets Cloudflare Pages serve them directly as static assets.
#
# Usage (Cloudflare Pages build command):
#     bash build.sh
# Or (when invoked from repo root):
#     cd apps/web && bash build.sh

set -e

# Always run from the script's own directory (apps/web), regardless of
# the caller's CWD.
cd "$(dirname "$0")"

echo "▶ Running OpenNext build..."
npx @opennextjs/cloudflare build --skipWranglerConfigCheck

echo "▶ Copying static assets into .open-next/..."
cp -r .open-next/assets/. .open-next/

echo "▶ Renaming worker.js to _worker.js..."
cp .open-next/worker.js .open-next/_worker.js

echo "▶ Generating _routes.json (excluding public/ from the Worker route)..."
node -e "
const fs = require('fs');
const path = require('path');

const exclude = ['/_next/static/*', '/_next/image/*', '/favicon.ico'];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else {
      exclude.push('/' + path.relative('public', full).replace(/\\\\/g, '/'));
    }
  }
}
walk('public');

const routes = { version: 1, include: ['/*'], exclude };
fs.writeFileSync('.open-next/_routes.json', JSON.stringify(routes));
console.log('  excluded', exclude.length, 'paths');
"

echo "▶ Build complete."
echo ""
echo "Generated .open-next/_routes.json:"
cat .open-next/_routes.json
echo ""
echo ".open-next/ contents:"
ls -la .open-next/
