import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { CliNormalizedConfig } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';
import type { LegacyAppTools } from '../types';

export function createToolsConfig(
  normalizedConfig: CliNormalizedConfig<LegacyAppTools>,
): BuilderConfig['tools'] {
  const { enableTsLoader } = normalizedConfig.output;
  const {
    autoprefixer,
    babel,
    minifyCss,
    terser,
    webpack,
    webpackChain,
    tsLoader,
    styledComponents,
    sass,
    postcss,
    less,
    htmlPlugin,
    // TODO: remove modernjs tools.lodash config
    // lodash,
  } = normalizedConfig.tools;

  const builderTsLoader = createBuilderTsLoader(tsLoader, enableTsLoader);
  const builderTsChecker = createBuilderTsChecker();

  return {
    tsChecker: builderTsChecker,
    autoprefixer,
    babel,
    minifyCss,
    terser,
    webpack,
    webpackChain: webpackChain as any,
    tsLoader: builderTsLoader,
    styledComponents,
    sass,
    postcss,
    less,
    // can't remove comment in html minify.
    // some html template insert by using those comments.
    htmlPlugin: [
      config => ({
        ...config,
        minify:
          typeof config.minify === 'object'
            ? {
                ...config.minify,
                removeComments: false,
              }
            : config.minify,
      }),
      // eslint-disable-next-line no-nested-ternary
      ...(Array.isArray(htmlPlugin)
        ? htmlPlugin
        : htmlPlugin
        ? [htmlPlugin]
        : []),
    ],
  };
}

function createBuilderTsLoader(
  tsLoader: CliNormalizedConfig<LegacyAppTools>['tools']['tsLoader'],
  enableTsLoader: CliNormalizedConfig<LegacyAppTools>['output']['enableTsLoader'],
) {
  const useTsLoader = Boolean(enableTsLoader);
  if (!useTsLoader) {
    return undefined;
  }

  const defaultTsLoader = {
    compilerOptions: {
      target: 'es5',
      module: 'ESNext',
    },
    transpileOnly: false,
    allowTsInNodeModules: true,
  };
  type TsLoaderUtils = {
    addIncludes: (items: string | RegExp | (string | RegExp)[]) => void;
    addExcludes: (items: string | RegExp | (string | RegExp)[]) => void;
  };
  return (_: unknown, utils: TsLoaderUtils) =>
    applyOptionsChain<any, TsLoaderUtils>(defaultTsLoader, tsLoader, utils);
}

export function createBuilderTsChecker() {
  const defaultTsChecker = {
    issue: {
      include: [{ file: '**/src/**/*' }],
      exclude: [
        { file: '**/*.(spec|test).ts' },
        { file: '**/node_modules/**/*' },
      ],
    },
  };
  return defaultTsChecker;
}
