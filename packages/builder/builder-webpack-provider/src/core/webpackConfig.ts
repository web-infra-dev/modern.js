import {
  debug,
  modifyBundlerChain,
  type NodeEnv,
  type BuilderTarget,
} from '@modern-js/builder-shared';
import { castArray } from '@modern-js/utils/lodash';
import { getCompiledPath } from '../shared';
import type { RuleSetRule, WebpackPluginInstance } from 'webpack';
import type WebpackChain from '@modern-js/builder-shared/webpack-5-chain';

import type {
  Context,
  WebpackConfig,
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../types';

async function modifyWebpackChain(
  context: Context,
  utils: ModifyWebpackChainUtils,
  chain: WebpackChain,
) {
  debug('modify webpack chain');

  const { ensureArray } = await import('@modern-js/utils');

  const [modifiedChain] = await context.hooks.modifyWebpackChainHook.call(
    chain,
    utils,
  );

  if (context.config.tools?.webpackChain) {
    ensureArray(context.config.tools.webpackChain).forEach(item => {
      item(modifiedChain, utils);
    });
  }

  debug('modify webpack chain done');

  return modifiedChain;
}

async function modifyWebpackConfig(
  context: Context,
  webpackConfig: WebpackConfig,
  utils: ModifyWebpackConfigUtils,
) {
  debug('modify webpack config');
  const { applyOptionsChain } = await import('@modern-js/utils');

  let [modifiedConfig] = await context.hooks.modifyWebpackConfigHook.call(
    webpackConfig,
    utils,
  );

  if (context.config.tools?.webpack) {
    modifiedConfig = applyOptionsChain(
      modifiedConfig,
      context.config.tools.webpack,
      utils,
      utils.mergeConfig,
    );
  }

  debug('modify webpack config done');
  return modifiedConfig;
}

async function getChainUtils(
  target: BuilderTarget,
): Promise<ModifyWebpackChainUtils> {
  const { default: webpack } = await import('webpack');
  const { default: HtmlWebpackPlugin } = await import('html-webpack-plugin');
  const { CHAIN_ID } = await import('@modern-js/utils');
  const nodeEnv = process.env.NODE_ENV as NodeEnv;

  const nameMap = {
    web: 'client',
    node: 'server',
    'modern-web': 'modern',
    'web-worker': 'web-worker',
    'service-worker': 'service-worker',
  };

  return {
    env: nodeEnv,
    name: nameMap[target] || '',
    target,
    webpack,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isServiceWorker: target === 'service-worker',
    isWebWorker: target === 'web-worker',
    CHAIN_ID,
    getCompiledPath,
    HtmlWebpackPlugin,
    HtmlPlugin: HtmlWebpackPlugin,
  };
}

async function getConfigUtils(
  config: WebpackConfig,
  chainUtils: ModifyWebpackChainUtils,
): Promise<ModifyWebpackConfigUtils> {
  const { merge } = await import('../../compiled/webpack-merge');

  return {
    ...chainUtils,

    mergeConfig: merge,

    addRules(rules: RuleSetRule | RuleSetRule[]) {
      const ruleArr = castArray(rules);
      if (!config.module) {
        config.module = {};
      }
      if (!config.module.rules) {
        config.module.rules = [];
      }
      config.module.rules.unshift(...ruleArr);
    },

    prependPlugins(plugins: WebpackPluginInstance | WebpackPluginInstance[]) {
      const pluginArr = castArray(plugins);
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.unshift(...pluginArr);
    },

    appendPlugins(plugins: WebpackPluginInstance | WebpackPluginInstance[]) {
      const pluginArr = castArray(plugins);
      if (!config.plugins) {
        config.plugins = [];
      }
      config.plugins.push(...pluginArr);
    },

    removePlugin(pluginName: string) {
      if (config.plugins) {
        config.plugins = config.plugins.filter(
          p => p.constructor.name !== pluginName,
        );
      }
    },
  };
}

export async function generateWebpackConfig({
  target,
  context,
}: {
  target: BuilderTarget;
  context: Context;
}) {
  const chainUtils = await getChainUtils(target);

  const bundlerChain = await modifyBundlerChain(context, chainUtils);

  const chain = await modifyWebpackChain(
    context,
    chainUtils,
    // module rules not support merge
    // need a special rule merge or use bundlerChain as WebpackChain
    bundlerChain as WebpackChain,
  );

  let webpackConfig = chain.toConfig();

  webpackConfig = await modifyWebpackConfig(
    context,
    webpackConfig,
    await getConfigUtils(webpackConfig, chainUtils),
  );

  return webpackConfig;
}
