import {
  debug,
  type NodeEnv,
  type BuilderTarget,
} from '@modern-js/builder-shared';
import { getCompiledPath } from '../shared';
import type { Context, RspackConfig, ModifyRspackConfigUtils } from '../types';

async function modifyRspackConfig(
  context: Context,
  rspackConfig: RspackConfig,
  utils: ModifyRspackConfigUtils,
) {
  debug('modify rspack config');
  const [modifiedConfig] = await context.hooks.modifyRspackConfigHook.call(
    rspackConfig,
    utils,
  );

  debug('modify rspack config done');
  return modifiedConfig;
}

function getConfigUtils(target: BuilderTarget): ModifyRspackConfigUtils {
  const nodeEnv = process.env.NODE_ENV as NodeEnv;

  return {
    env: nodeEnv,
    target,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isWebWorker: target === 'web-worker',
    getCompiledPath,
  };
}

export async function generateRspackConfig({
  target,
  context,
}: {
  target: BuilderTarget;
  context: Context;
}) {
  const utils = getConfigUtils(target);

  /** not set rspack default config here, the default value is configured in the corresponding plugin */
  const rspackConfig = await modifyRspackConfig(context, {}, utils);

  return rspackConfig;
}
