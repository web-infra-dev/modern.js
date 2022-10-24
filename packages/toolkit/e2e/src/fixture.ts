import path from 'path';
import fs from '@modern-js/utils/fs-extra';
import { getTemplatePath } from '@modern-js/utils';

const resolveFixturePackage = (id: string, cwd = process.cwd()) => {
  if (id.startsWith('.')) {
    return path.resolve(cwd, id);
  } else {
    const pkgMetaPath = require.resolve(`${id}/package.json`, {
      paths: [cwd],
    });
    const pkgRoot = path.dirname(pkgMetaPath);
    return pkgRoot;
  }
};

const resolveFixtureBuilderOptions = (root: string): Record<any, any> => {
  try {
    return require(path.resolve(root, 'builder.fixture.js'));
  } catch (e) {
    return {};
  }
};

const isNonSymbolicLink = (p: string) =>
  fs.lstat(p).then(f => !f.isSymbolicLink());

export interface UseFixtureOptions {
  /**
   * Whether to copy the fixture to a temporary directory.
   * It won't copy symlinks.
   * @default false
   */
  copy?: boolean;
}

/**
 * Use fixture package as the current working directory.
 * It will try to read `builder.fixture.js` as builder options in the fixture package.
 * By default it will enable `webpack` option so that dist files will be output to a temporary directory.
 * @param id Relative path or a resolvable package name.
 * @returns
 */
export const useFixture = async (id: string, options?: UseFixtureOptions) => {
  const pkgRoot = resolveFixturePackage(id);
  let cwd = pkgRoot;
  if (options?.copy) {
    cwd = getTemplatePath('modern-js/stub-builder/e2e');
    await fs.copy(pkgRoot, cwd, {
      filter: isNonSymbolicLink,
    });
  }
  const userOptions = resolveFixtureBuilderOptions(cwd);
  const ret: Record<any, any> = {
    cwd,
    webpack: true,
    ...userOptions,
  };
  return ret;
};
