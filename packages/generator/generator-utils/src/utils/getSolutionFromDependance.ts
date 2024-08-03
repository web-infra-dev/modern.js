import path from 'path';
import { SolutionToolsMap } from '@modern-js/generator-common';

import { readJsonSync } from '@modern-js/utils/fs-extra';

const getKeyByValue = (obj: Record<string, string>, value: string) =>
  Object.keys(obj).find(key => obj[key] === value);

interface GetSolutionFromDependenceRes {
  solution: string;
  dependence: string;
}

/**
 *
 * @param jsonPath
 * @param map eg. { 'mwa': '@modern-js/app-tools' }
 * @returns
 */
export const getSolutionFromDependance = (
  jsonPath?: string,
  map: Record<string, string> = SolutionToolsMap,
): GetSolutionFromDependenceRes => {
  const packageJsonPath =
    jsonPath ?? path.normalize(`${process.cwd()}/package.json`);
  const packageJson = readJsonSync(packageJsonPath);

  const solutions = Object.values(map)
    .map((i: string) => {
      if (packageJson.dependencies?.[i] || packageJson.devDependencies?.[i]) {
        return {
          solution: getKeyByValue(map, i) as string,
          dependence: i,
        };
      }
      return null;
    })
    .filter(Boolean);

  if (solutions.length === 0) {
    throw new Error('No solution found. Please check your package.json.');
  } else if (solutions.length > 1) {
    throw new Error(
      `Multiple solutions found: ${solutions.map(i => i?.solution).join(',')}`,
    );
  }

  return solutions[0] as GetSolutionFromDependenceRes;
};
