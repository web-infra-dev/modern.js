import assert from 'assert';
import {
  isLooseCssModules,
  getBrowserslistWithDefault,
  setConfig,
  isUseCssSourceMap,
  CSS_REGEX,
  type BuilderContext,
} from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  NormalizedConfig,
  ModifyRspackConfigUtils,
} from '../types';
import type { AcceptedPlugin } from 'postcss';
import { isUseCssExtract } from '../shared';

type CssNanoOptions = {
  configFile?: string | undefined;
  preset?: [string, object] | string | undefined;
};

export const getCssnanoDefaultOptions = (): CssNanoOptions => ({
  preset: [
    'default',
    {
      // merge longhand will break safe-area-inset-top, so disable it
      // https://github.com/cssnano/cssnano/issues/803
      // https://github.com/cssnano/cssnano/issues/967
      mergeLonghand: false,
    },
  ],
});

export async function getCssLoaderUses(
  config: NormalizedConfig,
  context: BuilderContext,
  {
    target,
    isProd,
    isServer,
    isWebWorker,
    getCompiledPath,
  }: ModifyRspackConfigUtils,
) {
  const uses = [];

  // 1. Check user config
  const enableExtractCSS = isUseCssExtract(config, target);
  const enableSourceMap = isUseCssSourceMap(config);
  // const enableCSSModuleTS = Boolean(config.output.enableCssModuleTSDeclaration);

  const { applyOptionsChain } = await import('@modern-js/utils');
  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
    target,
  );

  const localIdentName =
    config.output.cssModuleLocalIdentName ||
    // Using shorter classname in production to reduce bundle size
    (isProd ? '[hash:base64:5]' : '[path][name]__[local]--[hash:base64:5]');

  /**
   * postcss-module options.
   * different with css-loader, postcss-module without exportOnlyLocals option
   *
   * TODO: support css-module in rspack
   */
  const moduleConfig = {
    auto: config.output.disableCssModuleExtension ? isLooseCssModules : true,
    localsConvention: 'camelCase',
    generateScopedName: localIdentName,
  };

  const getPostcssConfig = () => {
    const extraPlugins: AcceptedPlugin[] = [];
    const utils = {
      addPlugins(plugins: AcceptedPlugin | AcceptedPlugin[]) {
        if (Array.isArray(plugins)) {
          extraPlugins.push(...plugins);
        } else {
          extraPlugins.push(plugins);
        }
      },
    };
    const enableCssMinify = !enableExtractCSS && isProd;

    const mergedConfig = applyOptionsChain(
      {
        postcssOptions: {
          plugins: [
            require(getCompiledPath('postcss-flexbugs-fixes')),
            require(getCompiledPath('postcss-custom-properties')),
            require(getCompiledPath('postcss-initial')),
            require(getCompiledPath('postcss-page-break')),
            require(getCompiledPath('postcss-font-variant')),
            require(getCompiledPath('postcss-media-minmax')),
            require(getCompiledPath('postcss-nesting')),
            require(getCompiledPath('autoprefixer'))(
              applyOptionsChain(
                {
                  flexbox: 'no-2009',
                  overrideBrowserslist: browserslist,
                },
                config.tools.autoprefixer,
              ),
            ),
            enableCssMinify
              ? require('cssnano')(getCssnanoDefaultOptions())
              : false,
          ].filter(Boolean),
        },
        sourceMap: enableSourceMap,
        modules: moduleConfig,
      },
      // postcss-loader will modify config
      config.tools.postcss || {},
      utils,
    );
    if (extraPlugins.length) {
      assert('postcssOptions' in mergedConfig);
      assert('plugins' in mergedConfig.postcssOptions!);
      mergedConfig.postcssOptions.plugins!.push(...extraPlugins);
    }
    return mergedConfig;
  };

  /**
   * TODO: support style-loader & ignore css (need rspack support inline css first)
   */
  //   if (isServer || isWebWorker) {
  //     const { default: ignoreCssLoader } = await import('../loaders/ignoreCssLoader');
  //     uses.push({
  //       name: CHAIN_ID.USE.IGNORE_CSS,
  //       loader: ignoreCssLoader,
  //     });
  //   }

  // TODO: use css-modules-typescript-loader
  // if (enableCSSModuleTS) {
  //   const { default: cssModulesTypescriptLoader } = await import(
  //     getCompiledPath('css-modules-typescript-loader')
  //   );

  //   uses.push({
  //     name: CHAIN_ID.USE.CSS_MODULES_TS,
  //     loader: cssModulesTypescriptLoader,
  //     options: {},
  //   });
  // }

  if (!isServer && !isWebWorker) {
    // todo: css module (exportOnlyLocals) required in server
    const postcssLoaderOptions = getPostcssConfig();

    // @ts-expect-error
    const { default: postcssLoader } = await import('@rspack/postcss-loader');
    uses.push({
      name: 'postcss',
      loader: postcssLoader,
      options: postcssLoaderOptions,
    });
  }

  return uses;
}

export const PluginCss = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-css',
    setup(api) {
      api.modifyRspackConfig(async (rspackConfig, utils) => {
        const config = api.getNormalizedConfig();

        const cssLoaderUses = await getCssLoaderUses(
          config,
          api.context,
          utils,
        );

        setConfig(rspackConfig, 'module.rules', [
          ...(rspackConfig.module?.rules || []),
          {
            name: 'css',
            test: CSS_REGEX,
            use: cssLoaderUses,
            type: 'css',
          },
        ]);
      });
    },
  };
};
