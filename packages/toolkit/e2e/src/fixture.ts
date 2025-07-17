import path from 'path';
import { getTemplatePath } from '@modern-js/utils';
import fs from '@modern-js/utils/fs-extra';

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
