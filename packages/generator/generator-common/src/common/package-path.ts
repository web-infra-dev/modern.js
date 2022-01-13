import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';

const PackagePathRegex = new RegExp(
  '^[a-z0-9]*[-_/]?([a-z0-9]*[-_]?[a-z0-9]*)*[-_/]?[a-z0-9-_]+$',
);

export const PackagePathSchema: Schema = {
  key: 'packagePath',
  label: () => i18n.t(localeKeys.packagePath.self),
  type: ['string'],
  when: (_, extra?: Record<string, unknown>) =>
    Boolean(extra?.isMonorepoSubProject),
  state: {
    value: {
      effectedByFields: ['packageName'],
      action: (data: Record<string, any>) => `${data.packageName || ''}`,
    },
  },
  validate: (value: string) => {
    if (!value) {
      return {
        success: false,
        message: i18n.t(localeKeys.packagePath.no_empty),
      };
    }
    if (!PackagePathRegex.test(value)) {
      return {
        success: false,
        message: i18n.t(localeKeys.packagePath.format),
      };
    }
    return {
      success: true,
    };
  },
};
