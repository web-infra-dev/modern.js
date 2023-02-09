import {
  debug,
  type NodeEnv,
  type BuilderTarget,
  modifyBundlerChain,
  BundlerConfig,
} from '@modern-js/builder-shared';
import { castArray, omitBy, isUndefined } from '@modern-js/utils/lodash';
import { getCompiledPath } from '../shared';
import type { Context, RspackConfig, ModifyRspackConfigUtils } from '../types';
import { formatRule, formatSplitChunks } from './formatConfig';

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

type ChainUtils = Omit<
  ModifyRspackConfigUtils,
  'addRules' | 'prependPlugins' | 'appendPlugins' | 'removePlugin'
>;

function getConfigUtils(
  config: RspackConfig,
  chainUtils: ChainUtils,
): ModifyRspackConfigUtils {
  return {
    ...chainUtils,

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

async function getChainUtils(target: BuilderTarget): Promise<ChainUtils> {
  const nodeEnv = process.env.NODE_ENV as NodeEnv;
  const { CHAIN_ID } = await import('@modern-js/utils');

  return {
    env: nodeEnv,
    target,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isServerWorker: target === 'service-worker',
    isWebWorker: target === 'web-worker',
    getCompiledPath,
    CHAIN_ID,
  };
}

/**
 * BundlerConfig type is similar to WebpackConfig. need convert
 */
const convertToRspackConfig = (config: BundlerConfig): RspackConfig => {
  return omitBy(
    {
      ...config,
      plugins: config.plugins as RspackConfig['plugins'],
      optimization: config.optimization
        ? {
            splitChunks: formatSplitChunks(config.optimization?.splitChunks),
            runtimeChunk: config.optimization?.runtimeChunk,
          }
        : undefined,
      module: omitBy(
        {
          rules: config.module?.rules?.map(formatRule),
        },
        isUndefined,
      ),
      cache:
        typeof config.cache === 'object' && config.cache.type === 'filesystem'
          ? {
              ...config.cache,
              /** rspack buildDependencies type is array */
              buildDependencies: Object.values(
                config.cache.buildDependencies || [],
              ).flat(),
            }
          : config.cache,
      /** value is consistent. one type is string, the other one type is enum */
      devtool: config.devtool as RspackConfig['devtool'],
      target: config.target as RspackConfig['target'],
    },
    isUndefined,
  );
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
    getConfigUtils(rspackConfig, chainUtils),
  );

  return rspackConfig;
}
