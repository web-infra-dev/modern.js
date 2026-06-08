const ignoreDeps = [
  'fs-extra',
  'react-router-dom',
  'tailwindcss',
  'tsconfig-paths',
  'typescript',
  'lru-cache',
  'tsx',
];

const ignorePackages = ['@otrade/transaction_adapter'];

const command = `check-dependency-version-consistency . ${ignoreDeps
  .map(dep => `--ignore-dep "${dep}"`)
  .concat(ignorePackages.map(pkg => `--ignore-package "${pkg}"`))
  .join(' ')}`;

console.log(`> ${command}`);

try {
  require('child_process').execSync(command, { stdio: 'inherit' });
} catch (e) {
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}
