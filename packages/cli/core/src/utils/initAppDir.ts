import path from 'path';
import { pkgUp } from '@modern-js/utils';

export const initAppDir = async (cwd?: string): Promise<string> => {
  if (!cwd) {
    cwd = process.cwd();
  }
  const pkg = await pkgUp({ cwd });

  if (!pkg) {
    throw new Error(`no package.json found in current work dir: ${cwd}`);
  }

  return path.dirname(pkg);
};
