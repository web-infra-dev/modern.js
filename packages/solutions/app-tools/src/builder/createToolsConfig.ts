import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { NormalizedConfig } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';

export function createToolsConfig(
  normalizedConfig: NormalizedConfig,
): BuilderConfig['tools'] {
  const { disableCssExtract, enableTsLoader } = normalizedConfig.output;
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lodash,
  } = normalizedConfig.tools;

  const builderTsLoader = createBuilderTsLoader(tsLoader, enableTsLoader);
  const builderTsChecker = createBuilderTsChecker(normalizedConfig.output);

  return {
    tsChecker: builderTsChecker,
    styleLoader: disableCssExtract ? {} : undefined,
    cssExtract: disableCssExtract ? false : undefined,
    autoprefixer,
    babel,
    minifyCss,
    terser,
    webpack,
    webpackChain: webpackChain as any,
    tsLoader: builderTsLoader,
    styledComponents:
      styledComponents as Required<BuilderConfig>['tools']['styledComponents'],
    sass: sass as Required<BuilderConfig>['tools']['sass'],
    postcss: postcss as Required<BuilderConfig>['tools']['postcss'],
    less: less as Required<BuilderConfig>['tools']['less'],
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
  tsLoader: NormalizedConfig['tools']['tsLoader'],
  enableTsLoader: NormalizedConfig['output']['enableTsLoader'],
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

export function createBuilderTsChecker(output: NormalizedConfig['output']) {
  if (output.enableTsLoader) {
    return false;
  }
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
