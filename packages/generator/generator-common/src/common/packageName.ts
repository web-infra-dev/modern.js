import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export const getPackageNameSchema = (
  extra: Record<string, any> = {},
): Schema => {
  return {
    type: 'string',
    title: extra?.isMonorepoSubProject
      ? i18n.t(localeKeys.packageName.sub_name)
      : i18n.t(localeKeys.packageName.self),
    'x-reactions': [
      {
        dependencies: [],
        fulfill: {
          state: {
            visible: Boolean(extra?.isMonorepoSubProject) || !extra?.isMwa,
          },
        },
      },
    ],
    'x-validate': (value: string) => {
      if (!value) {
        return i18n.t(localeKeys.packageName.no_empty);
      }
      return '';
    },
  };
};
