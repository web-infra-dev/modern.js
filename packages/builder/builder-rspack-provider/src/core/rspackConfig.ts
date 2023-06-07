import {
  debug,
  BundlerConfig,
  modifyBundlerChain,
  type NodeEnv,
  type BuilderTarget,
  type ModifyChainUtils,
} from '@modern-js/builder-shared';
import { castArray } from '@modern-js/utils/lodash';
import { getCompiledPath } from '../shared';
import type { Context, RspackConfig, ModifyRspackConfigUtils } from '../types';

async function modifyRspackConfig(
  context: Context,
  rspackConfig: RspackConfig,
  utils: ModifyRspackConfigUtils,
) {
  debug('modify Rspack config');
  let [modifiedConfig] = await context.hooks.modifyRspackConfigHook.call(
    rspackConfig,
    utils,
  );

  if (context.config.tools?.rspack) {
    const { applyOptionsChain } = await import('@modern-js/utils');

    modifiedConfig = applyOptionsChain(
      modifiedConfig,
      context.config.tools.rspack,
      utils,
      utils.mergeConfig,
    );
  }

  debug('modify Rspack config done');
  return modifiedConfig;
}

async function getConfigUtils(
  config: RspackConfig,
  chainUtils: ModifyChainUtils,
): Promise<ModifyRspackConfigUtils> {
  const { merge } = await import('../../compiled/webpack-merge');

  return {
    ...chainUtils,

    mergeConfig: merge,

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

async function getChainUtils(target: BuilderTarget): Promise<ModifyChainUtils> {
  const nodeEnv = process.env.NODE_ENV as NodeEnv;
  const { CHAIN_ID } = await import('@modern-js/utils');
  const { default: HtmlPlugin } = await import('@rspack/plugin-html');

  return {
    env: nodeEnv,
    target,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isServiceWorker: target === 'service-worker',
    isWebWorker: target === 'web-worker',
    getCompiledPath,
    CHAIN_ID,
    HtmlPlugin,
  };
}

/**
 * BundlerConfig type is similar to WebpackConfig.
 *
 * The type is not strictly compatible with rspack, such as devtool (string or const).
 *
 * There is no need to consider it in builder, and it is handed over to rspack for verification
 */
const convertToRspackConfig = (config: BundlerConfig): RspackConfig => {
  return config as any as RspackConfig;
};

export async function generateRspackConfig({
  target,
  context,
}: {
  target: BuilderTarget;
  context: Context;
}) {
  const chainUtils = await getChainUtils(target);
  const chain = await modifyBundlerChain(context, chainUtils);

  let rspackConfig = convertToRspackConfig(chain.toConfig());

  rspackConfig = await modifyRspackConfig(
    context,
    rspackConfig,
    await getConfigUtils(rspackConfig, chainUtils),
  );

  return rspackConfig;
}
