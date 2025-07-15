import type {
  AppLegacyNormalizedConfig,
  AppNormalizedConfig,
} from '../../types';

export function createToolsConfig(
  config: AppLegacyNormalizedConfig,
): AppNormalizedConfig<'webpack'>['tools'] {
  const {
    autoprefixer,
    babel,
    minifyCss,
    webpack,
    webpackChain,
    tsLoader,
    styledComponents,
    sass,
    postcss,
    less,
    htmlPlugin,
    devServer,
    tailwindcss,
    jest,
  } = config.tools;
  const { enableTsLoader } = config.output;

  return {
    tsLoader: enableTsLoader ? tsLoader : undefined,
    autoprefixer,
    babel,
    minifyCss,
    webpack,
    webpackChain,
    styledComponents,
    sass,
    postcss,
    less,
    htmlPlugin,
    devServer,
    tailwindcss,
    jest,
  };
}
