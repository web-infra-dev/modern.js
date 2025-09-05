const ignoreDeps = [
  'fs-extra',
  'glob',
  'react-router-dom',
  'tailwindcss',
  'tsconfig-paths',
  'twin.macro',
  'typescript',
  'lru-cache',
];

const command = `npx check-dependency-version-consistency@latest . ${ignoreDeps
  .map(dep => `--ignore-dep '${dep}'`)
  .join(' ')}`;

console.log(`> ${command}`);

try {
  require('child_process').execSync(command, { stdio: 'inherit' });
} catch (e) {
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}
