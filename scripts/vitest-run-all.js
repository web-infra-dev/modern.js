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

  const pnpmFilters = ['@scripts/vitest-config', '@modern-js/e2e']
    .map(dir => `--filter "${dir}..."`)
    .join(' ');
  const buildCmd = `pnpm ${pnpmFilters} run build`;
  // eslint-disable-next-line no-console
  console.log('>', buildCmd);

  try {
    await execa(buildCmd, {
      shell: SHELL,
      stdio: 'inherit',
    });

    await Promise.all(
      directories.map(cwd =>
        execa('pnpm run test', { shell: SHELL, stdio: 'inherit', cwd }),
      ),
    );
  } catch (err) {
    console.error(err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
})();
