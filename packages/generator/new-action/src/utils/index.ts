import path from 'path';
import { json5, semver } from '@modern-js/utils';
import {
  ActionFunction,
  ActionRefactor,
  Solution,
  SolutionToolsMap,
} from '@modern-js/generator-common';
import { fs, getModernPluginVersion } from '@modern-js/generator-utils';

const swap = (obj: Record<string, string>) => {
  return Object.keys(obj).reduce<Record<string, string>>((acc, key) => {
    acc[obj[key]] = key;
    return acc;
  }, {});
};

const dependenceToSolution = swap(SolutionToolsMap);

export function alreadyRepo(cwd = process.cwd()) {
  try {
    return fs.existsSync(path.resolve(cwd, 'package.json'));
  } catch (e) {
    return false;
  }
}

export const readJson = (jsonPath: string) => {
  if (!fs.existsSync(jsonPath)) {
    return {};
  }
  const jsonStr = fs.readFileSync(jsonPath, { encoding: 'utf8' });
  try {
    return json5.parse(jsonStr);
  } catch (error) {
    throw Error(`${jsonPath} is not a valid json, please check and try again.`);
  }
};

export function hasEnabledFunction(
  action: ActionFunction | ActionRefactor,
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
  peerDependencies: Record<string, string>,
  cwd: string,
) {
  const packageJsonPath = path.normalize(`${cwd}/package.json`);
  const packageJson = readJson(packageJsonPath);
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

export const getSolutionByDependance = (
  jsonPath?: string,
): string | undefined => {
  const packageJsonPath =
    jsonPath ?? path.normalize(`${process.cwd()}/package.json`);
  const packageJson = readJson(packageJsonPath);

  const solutions = Object.keys(dependenceToSolution)
    .map((i: string) => {
      if (packageJson.dependencies?.[i] || packageJson.devDependencies?.[i]) {
        return dependenceToSolution[i];
      }
      return '';
    })
    .filter(Boolean);

  if (solutions.length === 0) {
    throw new Error('No solution found. Please check your package.json.');
  } else if (solutions.length > 1) {
    throw new Error(`Multiple solutions found: ${solutions.join(',')}`);
  }

  return solutions[0];
};
