import path from 'path';
import { fs, semver } from '@modern-js/utils';

export const isBeyondReact17 = (cwd: string) => {
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

  return semver.satisfies(semver.minVersion(deps.react)!, '>=17.0.0');
};

export const getCoreJsVersion = () => {
  try {
    const { version } = fs.readJSONSync(
      require.resolve('core-js/package.json'),
      {
        encoding: 'utf-8',
      },
    );
    const [major, minor] = version.split('.');
    return [major, minor].join('.');
  } catch (err) {
    return '3';
  }
};
