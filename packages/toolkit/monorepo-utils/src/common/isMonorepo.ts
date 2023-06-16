import * as path from 'path';
import { fs } from '@modern-js/utils';
import { PNPM_WORKSPACE_FILE, RUSH_JSON_FILE } from '../constants';

export type IsMonorepoFn = (
  monorepoRootPath: string,
) => Promise<boolean> | boolean;

export type IsMonorepoResult = {
  isMonorepo: boolean;
  type: 'rush' | 'pnpm' | string;
};

export const isPnpmMonorepo: IsMonorepoFn = async (
  monorepoRootPath: string,
) => {
  const existPnpmWorkspaceFile = await fs.pathExists(
    path.join(monorepoRootPath, PNPM_WORKSPACE_FILE),
  );

  return existPnpmWorkspaceFile;
};

export const isRushMonorepo: IsMonorepoFn = async (
  monorepoRootPath: string,
) => {
  const existRushJsonFile = await fs.pathExists(
    path.join(monorepoRootPath, RUSH_JSON_FILE),
  );
  return existRushJsonFile;
};

export const isMonorepo = async (
  monorepoRootPath: string,
  otherMonrepoChecks?: Record<string, IsMonorepoFn>,
): Promise<IsMonorepoResult> => {
  if (typeof otherMonrepoChecks === 'object') {
    for (const [monorepoType, monorepoCheck] of Object.entries(
      otherMonrepoChecks,
    )) {
      if (
        typeof monorepoCheck === 'function' &&
        (await monorepoCheck(monorepoRootPath))
      ) {
        return {
          isMonorepo: true,
          type: monorepoType,
        };
      }
    }
  }

  if (await isPnpmMonorepo(monorepoRootPath)) {
    return {
      isMonorepo: true,
      type: 'pnpm',
    };
  }

  if (await isRushMonorepo(monorepoRootPath)) {
    return {
      isMonorepo: true,
      type: 'rush',
    };
  }

  return {
    isMonorepo: false,
    type: '',
  };
};
