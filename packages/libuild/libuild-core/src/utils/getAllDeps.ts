import path from 'path';
import fs from 'fs';

export const getAllDeps = <T>(
  root: string,
  options:
    | {
        dependencies?: boolean;
        peerDependencies?: boolean;
      }
    | boolean
) => {
  try {
    const json = JSON.parse(fs.readFileSync(path.resolve(root, './package.json'), 'utf8'));
    const dep = [...Object.keys((json.dependencies as T | undefined) || {})];
    const peerDep = [...Object.keys((json.peerDependencies as T | undefined) || {})];
    if (options === true) {
      return { dep, peerDep };
    }
    if (options === false) {
      return { dep: [], peerDep: [] };
    }
    return {
      dep: options.dependencies ? dep : [],
      peerDep: options.peerDependencies ? peerDep : [],
    };
  } catch (e) {
    return {
      dep: [],
      peerDep: [],
    };
  }
};
