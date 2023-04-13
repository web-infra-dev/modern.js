import {
  getBabelConfig,
  createBabelChain,
  type BabelOptions,
  BabelChain,
} from '@modern-js/babel-preset-app';
import {
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
  createVirtualModule,
  getBrowserslistWithDefault,
  applyScriptCondition,
} from '@modern-js/builder-shared';

import type {
  WebpackChain,
  BuilderPlugin,
  NormalizedConfig,
  TransformImport,
} from '../types';

const enableCoreJsEntry = (
  config: NormalizedConfig,
  isServer: boolean,
  isServiceWorker: boolean,
) => config.output.polyfill === 'entry' && !isServer && !isServiceWorker;

export const getUseBuiltIns = (config: NormalizedConfig) => {
  const { polyfill } = config.output;
  if (polyfill === 'ua' || polyfill === 'off') {
    return false;
  }
  return polyfill;
};

export const builderPluginBabel = (): BuilderPlugin => ({
  name: 'builder-plugin-babel',
  setup(api) {
    api.modifyWebpackChain(
      async (
        chain,
        {
          CHAIN_ID,
          target,
          isProd,
          isServer,
          isServiceWorker,
          getCompiledPath,
        },
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

          const chain = createBabelChain();
          applyPluginImport(chain, config.source.transformImport);

          // 3. Compute final babel config by @modern-js/babel-preset-app
          const babelOptions: BabelOptions = {
            babelrc: false,
            configFile: false,
            compact: isProd,
            ...getBabelConfig({
              target: isServer || isServiceWorker ? 'server' : 'client',
              appDirectory,
              useLegacyDecorators: !config.output.enableLatestDecorators,
              useBuiltIns:
                isServer || isServiceWorker ? false : getUseBuiltIns(config),
              chain,
              styledComponents: styledComponentsOptions,
              userBabelConfig: config.tools.babel,
              userBabelConfigUtils: babelUtils,
              overrideBrowserslist: browserslist,
              importAntd: false,
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

        addCoreJsEntry({ chain, config, isServer, isServiceWorker });
      },
    );
  },
});

/** Add core-js-entry to every entries. */
export function addCoreJsEntry({
  chain,
  config,
  isServer,
  isServiceWorker,
}: {
  chain: WebpackChain;
  config: NormalizedConfig;
  isServer: boolean;
  isServiceWorker: boolean;
}) {
  if (enableCoreJsEntry(config, isServer, isServiceWorker)) {
    const entryPoints = Object.keys(chain.entryPoints.entries() || {});
    const coreJsEntry = createVirtualModule('import "core-js";');

    for (const name of entryPoints) {
      chain.entry(name).prepend(coreJsEntry);
    }
  }
}

function applyPluginImport(
  chain: BabelChain,
  pluginImport?: TransformImport[],
) {
  if (pluginImport) {
    for (const item of pluginImport) {
      const name = item.libraryName;

      chain
        .plugin(`plugin-import-${name}`)
        .use(
          require.resolve(
            '@modern-js/babel-preset-base/compiled/babel-plugin-import',
          ),
          [item, name],
        );
    }
  }
}
