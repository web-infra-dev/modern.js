import path from 'path';
import {
  getBabelConfig,
  createBabelChain,
  type BabelOptions,
} from '@modern-js/babel-preset-app';
import {
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
  type BuilderContext,
} from '@modern-js/builder-shared';
import { getBrowserslistWithDefault } from '../shared';

import type { WebpackChain, BuilderPlugin, NormalizedConfig } from '../types';

export const CORE_JS_ENTRY = path.resolve(
  __dirname,
  '../runtime/core-js-entry.js',
);

export const getUseBuiltIns = (config: NormalizedConfig) => {
  const { polyfill } = config.output;
  if (polyfill === 'ua' || polyfill === 'off') {
    return false;
  }
  return polyfill;
};

export function applyScriptCondition(
  rule: WebpackChain.Rule,
  config: NormalizedConfig,
  context: BuilderContext,
  includes: (string | RegExp)[],
  excludes: (string | RegExp)[],
) {
  // compile all folders in app directory, exclude node_modules
  rule.include.add({
    and: [context.rootPath, { not: /node_modules/ }],
  });

  // let babel to transform core-js-entry, make `useBuiltins: 'entry'` working
  if (config.output.polyfill === 'entry') {
    rule.include.add(CORE_JS_ENTRY);
  }

  includes.forEach(condition => {
    rule.include.add(condition);
  });
  excludes.forEach(condition => {
    rule.exclude.add(condition);
  });

  // add source.include
  if (config.source.include) {
    config.source.include.forEach(condition => {
      rule.include.add(condition);
    });
  }
}

export const PluginBabel = (): BuilderPlugin => ({
  name: 'builder-plugin-babel',
  setup(api) {
    api.modifyWebpackChain(async (chain, utils) => {
      const { CHAIN_ID, getCompiledPath, isProd } = utils;
      const { applyOptionsChain, isUseSSRBundle } = await import(
        '@modern-js/utils'
      );

      const config = api.getNormalizedConfig();
      const browserslist = await getBrowserslistWithDefault(
        api.context.rootPath,
        config,
      );

      const getBabelOptions = (
        framework: string,
        appDirectory: string,
        config: NormalizedConfig,
      ) => {
        // 1. Get styled-components options
        const styledComponentsOptions = applyOptionsChain(
          {
            pure: true,
            displayName: true,
            ssr: isUseSSRBundle(config),
            transpileTemplateLiterals: true,
          },
          config.tools.styledComponents,
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
        const babelOptions: BabelOptions = {
          babelrc: false,
          configFile: false,
          compact: isProd,
          ...getBabelConfig({
            metaName: framework,
            appDirectory,
            useLegacyDecorators: !config.output.enableLatestDecorators,
            useBuiltIns: getUseBuiltIns(config),
            chain: createBabelChain(),
            styledComponents: styledComponentsOptions,
            userBabelConfig: config.tools.babel,
            userBabelConfigUtils: babelUtils,
            overrideBrowserslist: browserslist,
          }),
        };

        if (config.output.charset === 'utf8') {
          babelOptions.generatorOpts = {
            jsescOption: { minimal: true },
          };
        }

        return {
          babelOptions,
          includes,
          excludes,
        };
      };

      const { rootPath, framework } = api.context;
      const { babelOptions, includes, excludes } = getBabelOptions(
        framework,
        rootPath,
        config,
      );
      const useTsLoader = Boolean(config.tools.tsLoader);
      const rule = chain.module.rule(CHAIN_ID.RULE.JS);

      applyScriptCondition(rule, config, api.context, includes, excludes);

      rule
        .test(useTsLoader ? JS_REGEX : mergeRegex(JS_REGEX, TS_REGEX))
        .use(CHAIN_ID.USE.BABEL)
        .loader(getCompiledPath('babel-loader'))
        .options(babelOptions);

      /**
       * If a script is imported with data URI, it can be compiled by babel too.
       * This is used by some frameworks to create virtual entry.
       * https://webpack.js.org/api/module-methods/#import
       * @example: import x from 'data:text/javascript,export default 1;';
       */
      if (config.source.compileJsDataURI) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .mimetype({
            or: ['text/javascript', 'application/javascript'],
          })
          .use(CHAIN_ID.USE.BABEL)
          .loader(getCompiledPath('babel-loader'))
          .options(babelOptions);
      }

      addCoreJsEntry({ chain, config });
    });
  },
});

/** Add core-js-entry to every entries. */
export function addCoreJsEntry({
  chain,
  config,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
}) {
  if (config.output.polyfill === 'entry') {
    const entryPoints = Object.keys(chain.entryPoints.entries() || {});

    for (const name of entryPoints) {
      chain.entry(name).prepend(CORE_JS_ENTRY);
    }
  }
}
