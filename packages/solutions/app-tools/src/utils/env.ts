import { cutNameByHyphen } from '@modern-js/utils/universal';
import type { AppToolsContext } from '../types/plugin';

export function getAutoInjectEnv(appContext: AppToolsContext) {
  const { metaName } = appContext;
  const prefix = `${cutNameByHyphen(metaName)}_`.toUpperCase();
  const envReg = new RegExp(`^${prefix}`);
  return Object.keys(process.env).reduce(
    (prev, key) => {
      const value = process.env[key];
      if (envReg.test(key) && typeof value !== 'undefined') {
        prev[`process.env.${key}`] = value;
      }
      return prev;
    },
    {} as Record<string, string>,
  );
}
