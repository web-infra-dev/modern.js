import { SchemaEnum } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum BooleanConfig {
  NO = 'no',
  YES = 'yes',
}

export const BooleanConfigName: Record<string, () => string> = {
  [BooleanConfig.NO]: () => i18n.t(localeKeys.boolean.no),
  [BooleanConfig.YES]: () => i18n.t(localeKeys.boolean.yes),
};

export const getBooleanSchemas = (): SchemaEnum<string> => {
  return [
    {
      value: BooleanConfig.NO,
      label: BooleanConfigName[BooleanConfig.NO](),
    },
    {
      value: BooleanConfig.YES,
      label: BooleanConfigName[BooleanConfig.YES](),
    },
  ];
};
