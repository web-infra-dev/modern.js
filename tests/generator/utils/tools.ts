/* eslint-disable consistent-return */
import { fs, execa, semver } from '@modern-js/utils';

export async function usingTempDir(
  tmpDir: string,
  fn: (foldre: string) => Promise<void>,
) {
  const folder = tmpDir;
  await fs.mkdirp(folder);
  return fn(folder);
}

export async function execaWithStreamLog(
  command: string,
  args: string[],
  options: Record<string, any>,
) {
  console.info('execaWithStreamLog', command, args, options);
  try {
    const promise = await execa(command, args, {
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
      ...options,
    });
    return promise;
  } catch (e) {
    console.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

export function getPackageManager(projectName: string) {
  const isNode16 = semver.gte(process.versions.node, '16.0.0');
  if (!isNode16) {
    return 'pnpm';
  }
  // eslint-disable-next-line no-nested-ternary
  return projectName.includes('pnpm')
    ? 'pnpm'
    : projectName.includes('yarn')
    ? 'yarn'
    : 'npm';
}
