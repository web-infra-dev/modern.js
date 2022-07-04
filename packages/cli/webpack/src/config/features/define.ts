import { DefinePlugin } from 'webpack';
import { CHAIN_ID } from '@modern-js/utils';
import type { IAppContext } from '@modern-js/core';
import type { ChainUtils } from '../shared';

function getCustomPublicEnv(appContext: IAppContext) {
  const { metaName } = appContext;
  const prefix = `${metaName.split(/[-_]/)[0]}_`.toUpperCase();
  const envReg = new RegExp(`^${prefix}`);
  return Object.keys(process.env).filter(key => envReg.test(key));
}

export function applyDefinePlugin({ chain, config, appContext }: ChainUtils) {
  const { envVars, globalVars } = config.source || {};
  const publicEnvVars = getCustomPublicEnv(appContext);

  chain.plugin(CHAIN_ID.PLUGIN.DEFINE).use(DefinePlugin, [
    {
      ...[
        'NODE_ENV',
        'BUILD_MODE',
        ...publicEnvVars,
        ...(envVars || []),
      ].reduce<Record<string, string>>((memo, name) => {
        memo[`process.env.${name}`] = JSON.stringify(process.env[name]);
        return memo;
      }, {}),
      ...Object.keys(globalVars || {}).reduce<Record<string, string>>(
        (memo, name) => {
          memo[name] = globalVars ? JSON.stringify(globalVars[name]) : '';
          return memo;
        },
        {},
      ),
    },
  ]);
}
