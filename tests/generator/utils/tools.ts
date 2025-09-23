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
    process.exit(1);
  }
}
