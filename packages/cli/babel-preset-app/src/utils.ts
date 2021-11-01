import fs from 'fs';
import path from 'path';
import semver from 'semver';

export const isBeyondReact17 = (cwd: string) => {
  const pkgInfo = JSON.parse(
    fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'),
  );

  const deps = { ...pkgInfo.devDependencies, ...pkgInfo.dependencies };

  if (typeof deps.react !== 'string') {
    return false;
  }

  return semver.satisfies(semver.minVersion(deps.react)!, '>=17.0.0');
};

// export const isPnpm = (appDirectory: string) => {
//   // pnpm 以及 rush 场景需要编译
//   const currentDir = appDirectory || process.cwd();
//   if (findMonorepoRoot(currentDir)) {
//     return getPkgManager(currentDir) === 'pnpm';
//   } else if (
//     fs.existsSync(path.resolve(currentDir, './pnpm-lock.yaml')) ||
//     fs.existsSync(path.resolve(currentDir, './.rush'))
//   ) {
//     return true;
//   }

//   return false;
// };
