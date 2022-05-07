import * as path from 'path';
import { FileSystem, JsonFile } from '@rushstack/node-core-library';
import { WORKSPACE_FILE } from '../constants';

const useLerna = (monorepoRootPath: string) => {
  if (FileSystem.exists(path.join(monorepoRootPath, WORKSPACE_FILE.LERNA))) {
    return true;
  }
  return false;
};

const useYarnWorkspaces = (monorepoRootPath: string) => {
  if (!FileSystem.exists(path.join(monorepoRootPath, WORKSPACE_FILE.YARN))) {
    return false;
  }
  const json = JsonFile.load(path.join(monorepoRootPath, WORKSPACE_FILE.YARN));
  if ('workspaces' in json && json.workspaces.packages) {
    return true;
  }
  return false;
};

const usePnpmWorkspaces = (monorepoRootPath: string) => {
  if (FileSystem.exists(path.join(monorepoRootPath, WORKSPACE_FILE.PNPM))) {
    return true;
  }
  return false;
};

const isMonorepo = (monorepoRootPath: string) => {
  if (
    usePnpmWorkspaces(monorepoRootPath) ||
    useLerna(monorepoRootPath) ||
    useYarnWorkspaces(monorepoRootPath)
  ) {
    return true;
  }
  return false;
};

export const findMonorepoRoot = (starFindPath: string) => {
  let inMonorepo = false;
  let findPath = starFindPath;

  while (findPath !== '/') {
    if (isMonorepo(findPath)) {
      inMonorepo = true;
      break;
    }
    findPath = path.dirname(findPath);
  }

  return inMonorepo ? findPath : undefined;
};

export const getWorkspaceFile = (startFindPath: string) => {
  const rootPath = findMonorepoRoot(startFindPath);
  if (!rootPath) {
    throw new Error(
      '[Auto Find Mode]: not find any monorepo workspace file, you can set `packagesMatchs.workspaceFile`',
    );
  }
  if (usePnpmWorkspaces(rootPath)) {
    return WORKSPACE_FILE.PNPM;
  } else if (useLerna(rootPath)) {
    return WORKSPACE_FILE.LERNA;
  } else if (useYarnWorkspaces(rootPath)) {
    return WORKSPACE_FILE.YARN;
  } else {
    throw new Error(
      '[Auto Find Mode]: not find any monorepo workspace file, you can set `packagesMatchs.workspaceFile`',
    );
  }
};

export type PackageManagerType = 'pnpm' | 'yarn' | 'npm';

export const packageManagerFlag = {
  pnpm: [WORKSPACE_FILE.PNPM, 'pnpm-lock.yaml'],
  yarn: ['yarn.lock', useYarnWorkspaces],
  npm: [() => true],
};

const usePnpmPackageManager = (monorepoRootPath: string) =>
  packageManagerFlag.pnpm.some(flag =>
    FileSystem.exists(path.join(monorepoRootPath, flag)),
  );

const useYarnPackageManager = (monorepoRootPath: string) =>
  packageManagerFlag.yarn.some(flag => {
    if (typeof flag === 'function') {
      return flag(monorepoRootPath);
    }

    return FileSystem.exists(path.join(monorepoRootPath, flag));
  });

export const getPackageManager = (
  monorepoRootPath: string,
): PackageManagerType => {
  if (usePnpmPackageManager(monorepoRootPath)) {
    return 'pnpm';
  } else if (useYarnPackageManager(monorepoRootPath)) {
    return 'yarn';
  }

  return 'npm';
};

export const getMonorepoBaseData = (root: string = process.cwd()) => {
  const rootPath = findMonorepoRoot(root);
  if (!rootPath) {
    throw new Error(
      'not find any monorepo, you can add lerna、pnpm or yarn workspace file',
    );
  }
  return {
    rootPath,
    packageManager: getPackageManager(rootPath),
  };
};
