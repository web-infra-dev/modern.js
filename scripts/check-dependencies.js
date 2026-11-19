const { execSync, spawnSync } = require('node:child_process');
const path = require('node:path');

const exampleCheck = spawnSync(
  process.execPath,
  [path.join(__dirname, 'check-dependencies/check-examples.mjs')],
  { stdio: 'inherit' },
);
if (exampleCheck.error) console.error(exampleCheck.error);
let failed = exampleCheck.status !== 0;

const ignoreDeps = [
  'fs-extra',
  'react-router-dom',
  'tailwindcss',
  'tsconfig-paths',
  'typescript',
  'lru-cache',
  'tsx',
  // MCP SDK requires zod >=4.2, while existing BFF APIs still use zod 3.
  'zod',
];

// examples/ intentionally track the published packages (`latest`) and mirror
// real user apps, so they are exempt from workspace version consistency.
const command = `npx check-dependency-version-consistency . ${ignoreDeps
  .map(dep => `--ignore-dep "${dep}"`)
  .join(' ')} --ignore-package-pattern "^@examples/"`;

console.log(`> ${command}`);

try {
  execSync(command, { stdio: 'inherit' });
} catch {
  failed = true;
}
if (failed) process.exitCode = 1;
