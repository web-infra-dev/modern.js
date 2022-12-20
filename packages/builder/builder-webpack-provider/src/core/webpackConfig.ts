import {
  debug,
  modifyBundlerChain,
  type NodeEnv,
  type BuilderTarget,
} from '@modern-js/builder-shared';
import { castArray } from '@modern-js/utils/lodash';
import { getCompiledPath } from '../shared';
import type { RuleSetRule, WebpackPluginInstance } from 'webpack';
import type {
  Context,
  WebpackConfig,
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../types';

async function modifyWebpackChain(
  context: Context,
  utils: ModifyWebpackChainUtils,
  config: WebpackConfig,
) {
  debug('modify webpack chain');

  const { default: WebpackChain } = await import(
    '../../compiled/webpack-5-chain'
  );
  const { ensureArray } = await import('@modern-js/utils');

  const chain = new WebpackChain();

  chain.merge(config);

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
  const { merge } = await import('../../compiled/webpack-merge');

  let [modifiedConfig] = await context.hooks.modifyWebpackConfigHook.call(
    webpackConfig,
    utils,
  );

  if (context.config.tools?.webpack) {
    modifiedConfig = applyOptionsChain(
      modifiedConfig,
      context.config.tools.webpack,
      utils,
      merge,
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
  };

  return {
    env: nodeEnv,
    name: nameMap[target] || '',
    target,
    webpack,
    isProd: nodeEnv === 'production',
    isServer: target === 'node',
    isWebWorker: target === 'web-worker',
    CHAIN_ID,
    getCompiledPath,
    HtmlWebpackPlugin,
  };
}

function getConfigUtils(
  config: WebpackConfig,
  chainUtils: ModifyWebpackChainUtils,
): ModifyWebpackConfigUtils {
  return {
    ...chainUtils,

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
    bundlerChain.toConfig(),
  );

  let webpackConfig = chain.toConfig();

  webpackConfig = await modifyWebpackConfig(
    context,
    webpackConfig,
    getConfigUtils(webpackConfig, chainUtils),
  );

  return webpackConfig;
}
