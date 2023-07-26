const path = require('path');
const execa = require('execa');
const globby = require('globby');

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
    const buildCmd = `pnpm --filter "@scripts/vitest-config" run build`;
    await execa(buildCmd, {
      shell: SHELL,
      stdio: 'inherit',
    });

    for (const cwd of directories) {
      const args = ['run', 'test', ...restArgv];
      await execa('pnpm', args, { shell: SHELL, stdio: 'inherit', cwd });
    }
  } catch (err) {
    console.error(err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
})();
