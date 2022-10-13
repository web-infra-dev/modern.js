const path = require('path');
const execa = require('execa');
const globby = require('globby');

const SHELL = process.env.SHELL || true;

(async () => {
  const configs = await globby('**/vitest.config.ts', {
    followSymbolicLinks: false,
    onlyFiles: true,
    absolute: false,
    unique: true,
  });
  const directories = configs.map(config => path.dirname(config));

  const pnpmFilters = directories
    .map(dir => `--filter "{${dir}}..."`)
    .join(' ');
  const buildCmd = `pnpm run ${pnpmFilters} build`;
  // eslint-disable-next-line no-console
  console.log('>', buildCmd);
  await execa(buildCmd, { shell: SHELL, stdio: 'inherit' });

  for (const cwd of directories) {
    const cmd = 'pnpm run test';
    await execa(cmd, { shell: SHELL, stdio: 'inherit', cwd });
  }
})();
