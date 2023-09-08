const fs = require('fs');
const path = require('path/posix');
const { routes } = require('../dist/route.json');

/** @type {{ from: string; to: string; code: number; force?: boolean }[]} */
const redirects = [];

for (const route of routes) {
  if (route.isSSR) {
    // Unimplemented.
  } else if (route.isStream) {
    // Unimplemented.
  } else if (route.isSPA) {
    redirects.push({
      from: path.join(route.urlPath, '*'),
      to: route.entryPath,
      code: 200,
    });
  } else {
    // Unimplemented.
  }
}

const output = redirects
  .map(r => `${r.from} ${r.to} ${r.code}${r.force ? '!' : ''}`)
  .join('\n');
fs.writeFileSync(
  path.resolve(__dirname, '../dist/_redirects'),
  output,
  'utf-8',
);
console.log(`Created _redirects file with rules:\n`, output);
