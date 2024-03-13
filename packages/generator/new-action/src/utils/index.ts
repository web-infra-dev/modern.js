import path from 'path';
import { semver } from '@modern-js/utils';
import { readJsonSync } from '@modern-js/utils/fs-extra';
import {
  ActionFunction,
  ActionRefactor,
  Solution,
  SolutionToolsMap,
} from '@modern-js/generator-common';
import { fs, getModernPluginVersion } from '@modern-js/generator-utils';

export function alreadyRepo(cwd = process.cwd()) {
  try {
    return fs.existsSync(path.resolve(cwd, 'package.json'));
  } catch (e) {
    return false;
  }
}

export function hasEnabledFunction(
  action: ActionFunction | ActionRefactor,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
  peerDependencies: Record<string, string>,
  cwd: string,
) {
  const packageJsonPath = path.normalize(`${cwd}/package.json`);
  const packageJson = readJsonSync(packageJsonPath);
  if (!dependencies[action] && !devDependencies[action]) {
    return false;
  }
  if (dependencies[action]) {
    return packageJson.dependencies?.[dependencies[action]];
  }
  if (peerDependencies[action]) {
    return packageJson.peerDependencies?.[peerDependencies[action]];
  }
  if (!peerDependencies[action] && devDependencies[action]) {
    return packageJson.devDependencies?.[devDependencies[action]];
  }
  return false;
}

export function getGeneratorPath(generator: string, distTag: string) {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
}

export async function usePluginNameExport(
  solution: Solution,
  options: Record<string, string>,
) {
  const solutionVersion = await getModernPluginVersion(
    solution,
    SolutionToolsMap[Solution.MWA],
    options,
  );
  if (semver.valid(solutionVersion) && semver.gte(solutionVersion, '2.0.0')) {
    return semver.gt(solutionVersion, '2.24.0');
  }
  return true;
}
