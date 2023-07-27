const path = require('path');
const pMap = require('p-map');
const execa = require('execa');
const globby = require('globby');
const { fs } = require('@modern-js/utils');

const SHELL = process.env.SHELL || true;
const restArgv = process.argv.slice(2);

(async () => {
  const configs = await globby('**/vitest.config.ts', {
    followSymbolicLinks: false,
    onlyFiles: true,
    absolute: false,
    unique: true,
  });
  const directories = configs.map(config => path.dirname(config));

  try {
    const filters = ['@scripts/vitest-config'];

    directories.forEach(dir => {
      const pkgJson = path.join(dir, 'package.json');
      if (fs.existsSync(pkgJson)) {
        const { name } = fs.readJSONSync(pkgJson);
        filters.push(name);
      }
    });

    const filterCmd = filters
      .map(item => `--filter-prod "${item}"...`)
      .join(' ');
    const buildCmd = `SKIP_DTS=true pnpm ${filterCmd} run build`;

    console.log('>', buildCmd);
    await execa(buildCmd, {
      shell: SHELL,
      stdio: 'inherit',
    });

    await pMap(
      directories,
      async cwd => {
        const args = ['run', 'test', ...restArgv];
        await execa('pnpm', args, { shell: SHELL, stdio: 'inherit', cwd });
      },
      { concurrency: 2 },
    );
  } catch (err) {
    console.error(err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
})();
