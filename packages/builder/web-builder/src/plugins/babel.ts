import type {
  BuilderConfig,
  BuilderContext,
  BuilderPlugin,
  WebpackChain,
} from '../types';
import { getBabelConfig, createBabelChain } from '@modern-js/babel-preset-app';
import { TransformOptions } from '@babel/core';
import { JS_REGEX, TS_REGEX, mergeRegex } from '../shared';

import { isProd, applyOptionsChain, isUseSSRBundle } from '@modern-js/utils';
import Config from '@modern-js/utils/compiled/webpack-chain';
import path from 'path';

export const CORE_JS_ENTRY = path.resolve(
  __dirname,
  '../runtime/core-js-entry.js',
);

export const getUseBuiltIns = (config: BuilderConfig) => {
  const { polyfill } = config.output || {};
  if (polyfill === 'ua' || polyfill === 'off') {
    return false;
  }
  return polyfill;
};

export const getBabelOptions = (
  metaName: string,
  appDirectory: string,
  config: BuilderConfig,
) => {
  // 1. Get styled-components options
  const styledComponentsOptions = applyOptionsChain(
    {
      pure: true,
      displayName: true,
      ssr: isUseSSRBundle(config),
      transpileTemplateLiterals: true,
    },
    config.tools?.styledComponents,
  );

  // 2. Create babel util function about include/exclude
  const includes: Array<string | RegExp> = [];
  const excludes: Array<string | RegExp> = [];

  const babelUtils = {
    addIncludes(items: string | RegExp | Array<string | RegExp>) {
      if (Array.isArray(items)) {
        includes.push(...items);
      } else {
        includes.push(items);
      }
    },
    addExcludes(items: string | RegExp | Array<string | RegExp>) {
      if (Array.isArray(items)) {
        excludes.push(...items);
      } else {
        excludes.push(items);
      }
    },
  };

  // 3. Compute final babel config by @modern-js/babel-preset-app
  const babelOptions: TransformOptions = {
    babelrc: false,
    configFile: false,
    compact: isProd(),
    ...getBabelConfig({
      metaName,
      appDirectory,
      useLegacyDecorators: !config.output?.enableLatestDecorators,
      useBuiltIns: getUseBuiltIns(config),
      chain: createBabelChain(),
      styledComponents: styledComponentsOptions,
      userBabelConfig: config.tools?.babel,
      userBabelConfigUtils: babelUtils,
    }),
  };

  return {
    babelOptions,
    includes,
    excludes,
  };
};

export function applyScriptCondition(
  rule: Config.Rule,
  config: BuilderConfig,
  context: BuilderContext,
  includes: (string | RegExp)[],
  excludes: (string | RegExp)[],
) {
  // compile all folders in app directory, exclude node_modules
  rule.include.add({
    and: [context.rootPath, { not: /node_modules/ }],
  });

  // let babel to transform core-js-entry, make `useBuiltins: 'entry'` working
  if (config.output?.polyfill === 'entry') {
    rule.include.add(CORE_JS_ENTRY);
  }

  includes.forEach(condition => {
    rule.include.add(condition);
  });
  excludes.forEach(condition => {
    rule.exclude.add(condition);
  });
}

export const PluginBabel = (): BuilderPlugin => ({
  name: 'web-builder-plugin-babel',
  setup(api) {
    api.modifyWebpackChain(async chain => {
      const config = api.getBuilderConfig();
      const { CHAIN_ID } = await import('@modern-js/utils');
      const { rootPath, metaName } = api.context;
      const { babelOptions, includes, excludes } = getBabelOptions(
        metaName,
        rootPath,
        config || {},
      );
      const useTsLoader = Boolean(config.tools?.tsLoader);
      const rule = chain.module.rule(CHAIN_ID.RULE.JS);
      applyScriptCondition(rule, config, api.context, includes, excludes);
      rule
        .test(useTsLoader ? JS_REGEX : mergeRegex(JS_REGEX, TS_REGEX))
        .use(CHAIN_ID.USE.BABEL)
        .loader(require.resolve('babel-loader'))
        .options(babelOptions);
    });
  },
});

// add core-js-entry to every entries
export function addCoreJsEntry({
  chain,
  config,
}: {
  chain: WebpackChain;
  config: BuilderConfig;
}) {
  if (config.output?.polyfill === 'entry') {
    const entryPoints = Object.keys(chain.entryPoints.entries() || {});

    for (const name of entryPoints) {
      chain.entry(name).prepend(CORE_JS_ENTRY);
    }
  }
}
