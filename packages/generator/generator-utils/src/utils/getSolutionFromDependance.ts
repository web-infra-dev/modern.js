import path from 'path';
import { SolutionToolsMap } from '@modern-js/generator-common';

import { readJsonSync } from '@modern-js/utils/fs-extra';

const swap = (obj: Record<string, string>) => {
  return Object.keys(obj).reduce<Record<string, string>>((acc, key) => {
    acc[obj[key]] = key;
    return acc;
  }, {});
};

const dependenceToSolution = swap(SolutionToolsMap);

export const getSolutionFromDependance = (
  jsonPath?: string,
): string | undefined => {
  const packageJsonPath =
    jsonPath ?? path.normalize(`${process.cwd()}/package.json`);
  const packageJson = readJsonSync(packageJsonPath);

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
