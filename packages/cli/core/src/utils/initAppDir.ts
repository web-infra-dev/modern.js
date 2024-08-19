import path from 'path';
import { pkgUp } from '@modern-js/utils';

export const initAppDir = async (currentDir?: string): Promise<string> => {
  const cwd: string = currentDir || process.cwd();
  const pkg = await pkgUp({ cwd });

  if (!pkg) {
    throw new Error(`no package.json found in current work dir: ${cwd}`);
  }

  return path.dirname(pkg);
};
