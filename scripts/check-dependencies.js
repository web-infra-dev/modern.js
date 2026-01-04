const ignoreDeps = [
  '@types/node',
  'antd',
  'esbuild',
  'fs-extra',
  'glob',
  'minimatch',
  'react-router-dom',
  'tailwindcss',
  'tsconfig-paths',
  'twin.macro',
  'hono',
  'type-fest',
  'typescript',
  'react',
  '@types/react',
  'react-dom',
  '@types/react-dom',
  'lru-cache',
  'react-router',
  '@rspress/shared',
  'rspress',
];

const command = `npx check-dependency-version-consistency@5.0.1 . ${ignoreDeps
  .map(dep => `--ignore-dep '${dep}'`)
  .join(' ')}`;

console.log(`> ${command}`);

try {
  require('child_process').execSync(command, { stdio: 'inherit' });
} catch (e) {
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}
