import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';

export enum PackageManager {
  Pnpm = 'pnpm',
  Yarn = 'yarn',
  Npm = 'npm',
}

export const PackageManagerName: Record<string, () => string> = {
  [PackageManager.Pnpm]: () => 'pnpm',
  [PackageManager.Yarn]: () => 'Yarn',
  [PackageManager.Npm]: () => 'npm',
};

export const PackageManagerSchema: Schema = {
  key: 'packageManager',
  type: ['string'],
  label: () => i18n.t(localeKeys.packageManager.self),
  mutualExclusion: true,
  when: (_values, extra) => !extra?.isMonorepoSubProject,
  items: (_values, extra) =>
    Object.values(PackageManager)
      .filter(packageManager =>
        extra?.isMonorepo ? packageManager !== PackageManager.Npm : true,
      )
      .map(packageManager => ({
        key: packageManager,
        label: PackageManagerName[packageManager],
      })),
};
