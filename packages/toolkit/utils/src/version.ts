import path from 'path';
import execa from 'execa';
import { fs, semver } from './compiled';

export async function getPnpmVersion() {
  const { stdout } = await execa('pnpm', ['--version']);
  return stdout;
}

export const isReact18 = (cwd: string) => {
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
