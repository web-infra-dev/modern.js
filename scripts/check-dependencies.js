const ignoreDeps = [
  '@types/node',
  'antd',
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
