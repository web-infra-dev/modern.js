import {
  getBabelConfig,
  createBabelChain,
  type BabelOptions,
} from '@modern-js/babel-preset-app';
import {
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
  createVirtualModule,
  getBrowserslistWithDefault,
  type BuilderContext,
} from '@modern-js/builder-shared';

import type { WebpackChain, BuilderPlugin, NormalizedConfig } from '../types';

const enableCoreJsEntry = (config: NormalizedConfig, isServer: boolean) =>
  config.output.polyfill === 'entry' && !isServer;

export const getUseBuiltIns = (config: NormalizedConfig) => {
  const { polyfill } = config.output;
  if (polyfill === 'ua' || polyfill === 'off') {
    return false;
  }
  return polyfill;
};

export function applyScriptCondition({
  rule,
  config,
  context,
  includes,
  excludes,
}: {
  rule: WebpackChain.Rule;
  config: NormalizedConfig;
  context: BuilderContext;
  includes: (string | RegExp)[];
  excludes: (string | RegExp)[];
}) {
  // compile all folders in app directory, exclude node_modules
  rule.include.add({
    and: [context.rootPath, { not: /node_modules/ }],
  });

  [...includes, ...(config.source.include || [])].forEach(condition => {
    rule.include.add(condition);
  });

  [...excludes, ...(config.source.exclude || [])].forEach(condition => {
    rule.exclude.add(condition);
  });
}

export const builderPluginBabel = (): BuilderPlugin => ({
  name: 'builder-plugin-babel',
  setup(api) {
    api.modifyWebpackChain(
      async (
        chain,
        { CHAIN_ID, getCompiledPath, target, isProd, isServer },
      ) => {
        const { applyOptionsChain, isUseSSRBundle } = await import(
          '@modern-js/utils'
        );

        const config = api.getNormalizedConfig();
        const browserslist = await getBrowserslistWithDefault(
          api.context.rootPath,
          config,
          target,
        );

        const getBabelOptions = (
          appDirectory: string,
          config: NormalizedConfig,
        ) => {
          // 1. Get styled-components options
          const styledComponentsOptions = applyOptionsChain(
            {
              // "pure" is used to improve dead code elimination in production.
              // we don't need to enable it in development because it will slow down the build process.
              pure: isProd,
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
              target: isServer ? 'server' : 'client',
              appDirectory,
              useLegacyDecorators: !config.output.enableLatestDecorators,
              useBuiltIns: isServer ? false : getUseBuiltIns(config),
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

        const { rootPath } = api.context;
        const { babelOptions, includes, excludes } = getBabelOptions(
          rootPath,
          config,
        );
        const useTsLoader = Boolean(config.tools.tsLoader);
        const rule = chain.module.rule(CHAIN_ID.RULE.JS);

        applyScriptCondition({
          rule,
          config,
          context: api.context,
          includes,
          excludes,
        });

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

        addCoreJsEntry({ chain, config, isServer });
      },
    );
  },
});

/** Add core-js-entry to every entries. */
export function addCoreJsEntry({
  chain,
  config,
  isServer,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
  isServer: boolean;
}) {
  if (enableCoreJsEntry(config, isServer)) {
    const entryPoints = Object.keys(chain.entryPoints.entries() || {});
    const coreJsEntry = createVirtualModule('import "core-js";');

    for (const name of entryPoints) {
      chain.entry(name).prepend(coreJsEntry);
    }
  }
}
