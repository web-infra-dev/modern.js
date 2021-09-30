import { UserConfig } from '../config';
import { traverseSchema } from '../config/schema';

export const deepGet = (obj: any, key: string) => {
  for (const p of key.split('.')) {
    // eslint-disable-next-line no-param-reassign
    obj = obj ? obj[p] : undefined;
  }
  return obj;
};

export const repeatKeyWarning = (
  schema: any,
  jsConfig: UserConfig,
  pkgConfig: UserConfig,
) => {
  const keys = traverseSchema(schema);

  for (const key of keys) {
    if (
      deepGet(jsConfig, key) !== undefined &&
      deepGet(pkgConfig, key) !== undefined
    ) {
      throw new Error(
        `The same configuration ${key} exists in modern.config.js and package.json.\n Please remove it from package.json.`,
      );
    }
  }
};
