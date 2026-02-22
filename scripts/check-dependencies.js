const ignoreDeps = [
  'fs-extra',
  'react-router-dom',
  'tailwindcss',
  'tsconfig-paths',
  'typescript',
  'lru-cache',
  'tsx',
];

const ignorePaths = [
  'tests/integration/rsc-mf/host',
  'tests/integration/rsc-mf/remote',
];

const command = `npx check-dependency-version-consistency@latest . ${ignoreDeps
  .map(dep => `--ignore-dep "${dep}"`)
  .join(' ')} ${ignorePaths.map(path => `--ignore-path "${path}"`).join(' ')}`;

console.log(`> ${command}`);

try {
  require('child_process').execSync(command, { stdio: 'inherit' });
} catch (e) {
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}
