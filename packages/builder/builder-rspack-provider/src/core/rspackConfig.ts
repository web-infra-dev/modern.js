import {
  debug,
  type NodeEnv,
  type BuilderTarget,
} from '@modern-js/builder-shared';
import { castArray } from '@modern-js/utils/lodash';
import { getCompiledPath } from '../shared';
import type { Context, RspackConfig, ModifyRspackConfigUtils } from '../types';

async function modifyRspackConfig(
  context: Context,
  rspackConfig: RspackConfig,
  utils: ModifyRspackConfigUtils,
) {
  debug('modify rspack config');
  let [modifiedConfig] = await context.hooks.modifyRspackConfigHook.call(
    rspackConfig,
    utils,
  );

  if (context.config.tools?.rspack) {
    const { applyOptionsChain } = await import('@modern-js/utils');
    const { merge } = await import('../../compiled/webpack-merge');

    modifiedConfig = applyOptionsChain(
      modifiedConfig,
      context.config.tools.rspack,
      utils,
      merge,
    );
  }

  debug('modify rspack config done');
  return modifiedConfig;
}

function getRspackConfigUtils(
  config: RspackConfig,
): Pick<
  ModifyRspackConfigUtils,
  'addRules' | 'prependPlugins' | 'appendPlugins' | 'removePlugin'
> {
  return {
    addRules(rules) {
      const ruleArr = castArray(rules);
      if (!config.module) {
        config.module = {};
      }
      if (!config.module.rules) {
        config.module.rules = [];
      }
      config.module.rules.unshift(...ruleArr);
    },

    prependPlugins(plugins) {
      const pluginArr = castArray(plugins);
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.unshift(...pluginArr);
    },

    appendPlugins(plugins) {
      const pluginArr = castArray(plugins);
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.push(...pluginArr);
    },

    removePlugin(pluginName) {
      if (config.plugins) {
        config.plugins = config.plugins.filter(p => p.name !== pluginName);
      }
    },
  };
}

function getConfigUtils(
  target: BuilderTarget,
  config: RspackConfig,
): ModifyRspackConfigUtils {
  const nodeEnv = process.env.NODE_ENV as NodeEnv;

  return {
    env: nodeEnv,
    target,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isWebWorker: target === 'web-worker',
    getCompiledPath,
    ...getRspackConfigUtils(config),
  };
}

export async function generateRspackConfig({
  target,
  context,
}: {
  target: BuilderTarget;
  context: Context;
}) {
  let rspackConfig = {};

  const utils = getConfigUtils(target, rspackConfig);

  /** not set rspack default config here, the default value is configured in the corresponding plugin */
  rspackConfig = await modifyRspackConfig(context, rspackConfig, utils);

  return rspackConfig;
}
