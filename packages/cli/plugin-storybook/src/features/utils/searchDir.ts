import path from 'path';
import { Import } from '@modern-js/utils';

const findup: typeof import('findup-sync') = Import.lazy(
  'findup-sync',
  require,
);

export type SearchDirOptions = {
  target: string;
  cwd: string;
  relative: boolean;
};

const defaultOptions = {
  cwd: process.cwd(),
  relative: false,
};

export const searchDir = (
  customOptions: Pick<SearchDirOptions, 'target'> & Partial<SearchDirOptions>,
) => {
  const options: SearchDirOptions = { ...defaultOptions, ...customOptions };
  const { cwd, target, relative } = options;

  const formatPath = (modulesDir: string) => {
    if (relative) {
      return path.relative(cwd, modulesDir);
    } else {
      return modulesDir;
    }
  };

  const modulesArray = [];
  let currentDir = cwd;
  let duplicateFound = false;
  let modulesDir: string | null = null;

  do {
    modulesDir = findup(target, { cwd: currentDir });

    if (modulesDir !== null) {
      const foundModulesDir = formatPath(modulesDir);
      duplicateFound = modulesArray.includes(foundModulesDir);
      if (!duplicateFound) {
        modulesArray.push(foundModulesDir);
        currentDir = path.join(modulesDir, '../../');
      }
    }
  } while (modulesDir && !duplicateFound);

  return modulesArray;
};
