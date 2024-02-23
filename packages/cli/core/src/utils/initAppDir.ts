import path from 'path';
import { pkgUp } from '@modern-js/utils';

export const initAppDir = async (
  cwd?: string,
  fallback?: boolean | string,
): Promise<string> => {
  if (!cwd) {
    // eslint-disable-next-line no-param-reassign
    cwd = process.cwd();
  }
  const pkg = await pkgUp({ cwd });

  if (!pkg) {
    if (fallback) {
      return typeof fallback === 'string' ? fallback : process.cwd();
    }

    throw new Error(`no package.json found in current work dir: ${cwd}`);
  }

  return path.dirname(pkg);
};
