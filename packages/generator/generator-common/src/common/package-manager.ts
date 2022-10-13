import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum PackageManager {
  Pnpm = 'pnpm',
  Yarn = 'yarn',
  Npm = 'npm',
}

export const PackageManagerName: Record<string, string> = {
  [PackageManager.Pnpm]: 'pnpm',
  [PackageManager.Yarn]: 'Yarn',
  [PackageManager.Npm]: 'npm',
};

export const getPackageManagerSchema = (extra: Record<string, any>): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.packageManager.self),
    enum: Object.values(PackageManager)
      .filter(packageManager =>
        extra?.solution === 'monorepo'
          ? packageManager !== PackageManager.Npm
          : true,
      )
      .map(packageManager => ({
        value: packageManager,
        label: PackageManagerName[packageManager],
      })),
    'x-reactions': [
      {
        dependencies: [],
        fulfill: {
          state: {
            visible: !extra?.isMonorepoSubProject && !extra?.isSubProject,
          },
        },
      },
    ],
  };
};
