import { execa } from '@modern-js/utils';
import { stripAnsi } from '@modern-js/generator-utils';

export const getVersion = async (
  packageName: string,
  distTag = 'latest',
  registry?: string,
) => {
  const args = [
    'view',
    `${packageName}@${distTag}`,
    'version',
    registry,
  ].filter(Boolean) as string[];

  const { stdout } = await execa('npm', args);

  if (stdout) {
    return stripAnsi(stdout);
  } else {
    throw Error(`Get version error while run: npm ${args.join(' ')}`);
  }
};
