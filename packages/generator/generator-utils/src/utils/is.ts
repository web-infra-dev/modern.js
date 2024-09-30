import path from 'path';
import { fs } from '@modern-js/codesmith-utils/fs-extra';
import { semver } from '@modern-js/codesmith-utils/semver';

export const isReact18 = (cwd: string = process.cwd()) => {
  const pkgPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    return false;
  }

  const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies,
  };

  if (typeof deps.react !== 'string') {
    return false;
  }

  return semver.satisfies(semver.minVersion(deps.react)!, '>=18.0.0');
};
