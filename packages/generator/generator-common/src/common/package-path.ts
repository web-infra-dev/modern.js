import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

const PackagePathRegex = new RegExp(
  '^[a-z0-9]*[-_/]?([a-z0-9]*[-_]?[a-z0-9]*)*[-_/]?[a-z0-9-_]+$',
);

export const getPackagePathSchema = (extra: Record<string, any>): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.packagePath.self),
    'x-reactions': [
      {
        dependencies: ['packageName'],
        fulfill: {
          state: {
            value: '{{$deps[0]}}',
            visible: Boolean(extra?.isMonorepoSubProject),
          },
        },
      },
    ],
    'x-validate': (value: string) => {
      if (!value) {
        return i18n.t(localeKeys.packagePath.no_empty);
      }
      if (!PackagePathRegex.test(value)) {
        return i18n.t(localeKeys.packagePath.format);
      }
      return '';
    },
  };
};
