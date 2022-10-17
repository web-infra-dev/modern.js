import {
  debug,
  type NodeEnv,
  type BuilderTarget,
} from '@modern-js/builder-shared';
import { getCompiledPath } from '../shared';
import type { Context, ModifyRspackUtils, RspackConfig } from '../types';

function generateDefaultRspackConfig(): RspackConfig {
  return {
    //todo default config
  } as RspackConfig
}

async function modifyRspackConfig(
  context: Context,
  rspackConfig: RspackConfig,
  utils: ModifyRspackUtils,
) {
  debug('modify rspack config');
  let [modifiedConfig] = await context.hooks.modifyRspackConfigHook.call(
    rspackConfig,
    utils,
  );

  debug('modify rspack config done');
  return modifiedConfig;
}

export async function generateRspackConfig({
  target,
  context,
}: {
  target: BuilderTarget;
  context: Context;
}) {
  const { CHAIN_ID } = await import('@modern-js/utils');

  const nodeEnv = process.env.NODE_ENV as NodeEnv;
  const utils: ModifyRspackUtils = {
    env: nodeEnv,
    target,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    CHAIN_ID,
    getCompiledPath,
  };

  const rspackConfig = await modifyRspackConfig(
    context,
    generateDefaultRspackConfig(),
    utils,
  );

  return rspackConfig;
}
