import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';

export const PackageNameSchema: Schema = {
  key: 'packageName',
  label: (_, extra) =>
    extra?.isMonorepoSubProject
      ? i18n.t(localeKeys.packageName.sub_name)
      : i18n.t(localeKeys.packageName.self),
  type: ['string'],
  when: (_, extra) => Boolean(extra?.isMonorepoSubProject) || !extra?.isMwa,
  validate: (value: string) => {
    if (!value) {
      return {
        success: false,
        message: i18n.t(localeKeys.packageName.no_empty),
      };
    }
    return {
      success: true,
    };
  },
};
