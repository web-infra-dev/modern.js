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
  const directories = configs
    .map(config => path.dirname(config))
    // TODO SWC 插件的单测在 windows 下无法跑通，暂时排除
    .filter(dir => !dir.includes('plugin-swc'));

  const pnpmFilters = directories
    .map(dir => `--filter "{${dir}}..."`)
    .join(' ');
  const buildCmd = `pnpm run ${pnpmFilters} build`;
  // eslint-disable-next-line no-console
  console.log('>', buildCmd);

  try {
    await execa(buildCmd, { shell: SHELL, stdio: 'inherit' });

    for (const cwd of directories) {
      const cmd = 'pnpm run test';
      await execa(cmd, { shell: SHELL, stdio: 'inherit', cwd });
    }
  } catch (err) {
    console.error(err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
})();
