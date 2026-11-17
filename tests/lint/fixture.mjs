import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const cli = join(dirname(require.resolve('rstack/package.json')), 'bin/rs.js');
const config = fileURLToPath(
  new URL('../../rstack.config.mts', import.meta.url),
);
const execute = promisify(execFile);

export async function withLintFixture(run) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'modern-lint-')));
  const src = join(root, 'packages/fixture/src');

  const lint = async files => {
    const args = [
      cli,
      'lint',
      '--config',
      config,
      '--format',
      'jsonline',
      ...files,
    ];
    try {
      const { stdout } = await execute(process.execPath, args, {
        cwd: root,
        timeout: 30000,
      });
      return { code: 0, stdout };
    } catch (error) {
      if (error.code !== 1) throw error;
      return { code: error.code, stdout: error.stdout };
    }
  };

  try {
    await mkdir(src, { recursive: true });
    await writeFile(
      join(src, '../tsconfig.json'),
      JSON.stringify({
        compilerOptions: { allowJs: true, jsx: 'react-jsx' },
        include: ['src'],
      }),
    );
    await run({ src, lint });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
