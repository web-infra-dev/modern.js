const ignoreDeps = [
  'fs-extra',
  'react-router-dom',
  'tailwindcss',
  'tsconfig-paths',
  'typescript',
  'lru-cache',
  'tsx',
];

// examples/ intentionally track the published packages (`latest`) and mirror
// real user apps, so they are exempt from workspace version consistency.
const command = `npx check-dependency-version-consistency@latest . ${ignoreDeps
  .map(dep => `--ignore-dep "${dep}"`)
  .join(' ')} --ignore-package-pattern "^@examples/"`;

console.log(`> ${command}`);

try {
  require('child_process').execSync(command, { stdio: 'inherit' });
} catch (e) {
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}
