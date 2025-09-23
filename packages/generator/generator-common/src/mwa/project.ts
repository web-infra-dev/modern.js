import type { Schema } from '@modern-js/codesmith-formily';
import {
  BooleanConfig,
  getPackageNameSchema,
  getPackagePathSchema,
} from '../common';

export const getMWASchemaProperties = (
  extra: Record<string, any>,
): Schema['properties'] => {
  return {
    packageName: getPackageNameSchema(extra),
    packagePath: getPackagePathSchema(extra),
  };
};

export const getMWASchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: getMWASchemaProperties(extra),
  };
};

export const MWADefaultConfig = {
  needModifyMWAConfig: BooleanConfig.NO,
};
