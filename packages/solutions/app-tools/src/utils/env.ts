import type { IAppContext } from '../types';

export function getAutoInjectEnv(appContext: IAppContext) {
  const { metaName } = appContext;
  const prefix = `${metaName.split(/[-_]/)[0]}_`.toUpperCase();
  const envReg = new RegExp(`^${prefix}`);
  return Object.keys(process.env).reduce((prev, key) => {
    const value = process.env[key];
    if (envReg.test(key) && typeof value !== 'undefined') {
      prev[`process.env.${key}`] = value;
    }
    return prev;
  }, {} as Record<string, string>);
}
