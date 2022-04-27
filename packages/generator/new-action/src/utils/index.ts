import path from 'path';
import { json5 } from '@modern-js/utils';
import { ActionFunction } from '@modern-js/generator-common';
import { fs } from '@modern-js/generator-utils';

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
  action: ActionFunction,
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
