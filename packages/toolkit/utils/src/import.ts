import * as path from 'path';
import * as fs from 'fs-extra';
import JSON5 from 'json5';

// cover: https://rushstack.io/pages/api/node-core-library.import.lazy/
const lazy = (moduleName: string, requireFn: (id: string) => unknown): any => {
  const importLazyLocal: (moduleName: string) => unknown =
    require('import-lazy')(requireFn);
  return importLazyLocal(moduleName);
};

export { lazy as lazyImport };

export const Import = { lazy };

const packageJsonPathCache = new Map();
const packageJsonName = 'package.json';

export const tryGetPackageJsonPath = (
  packageJsonFileOrFolderPath: string,
): string | undefined => {
  if (packageJsonPathCache.has(packageJsonFileOrFolderPath)) {
    return packageJsonPathCache.get(packageJsonFileOrFolderPath);
  }

  if (fs.existsSync(path.join(packageJsonFileOrFolderPath, packageJsonName))) {
    packageJsonPathCache.set(
      packageJsonFileOrFolderPath,
      path.join(packageJsonFileOrFolderPath, packageJsonName),
    );
    return path.join(packageJsonFileOrFolderPath, packageJsonName);
  }

  const parentFolder: string | undefined = path.dirname(
    packageJsonFileOrFolderPath,
  );
  if (!parentFolder || parentFolder === packageJsonFileOrFolderPath) {
    packageJsonPathCache.set(packageJsonFileOrFolderPath, undefined);
    return undefined;
  }

  const result: string | undefined = tryGetPackageJsonPath(parentFolder);
  packageJsonPathCache.set(packageJsonFileOrFolderPath, result);

  return result;
};

export const getPackageJsonFrom = (fileOrFolderPath: string) => {
  const packageJsonFilePath: string | undefined =
    tryGetPackageJsonPath(fileOrFolderPath);
  if (!packageJsonFilePath) {
    return undefined;
  }

  const pacakgeJsonString = fs.readFileSync(packageJsonFilePath, 'utf-8');

  try {
    return JSON5.parse(pacakgeJsonString);
  } catch (e: any) {
    return undefined;
  }
};
