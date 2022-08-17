import { getDistPath, DEFAULT_PORT } from '../shared';
import type {
  BuilderConfig,
  BuilderContext,
  BuilderPlugin,
  MiniCSSExtractPluginOptions,
} from '../types';

function getPublicPath({
  config,
  isProd,
  context,
}: {
  config: BuilderConfig;
  isProd: boolean;
  context: BuilderContext;
}) {
  const { dev, output } = config;

  let publicPath = '/';

  if (isProd) {
    if (output?.assetPrefix) {
      publicPath = output.assetPrefix;
    }
  } else if (typeof dev?.assetPrefix === 'string') {
    publicPath = dev.assetPrefix;
  } else if (dev?.assetPrefix === true) {
    const ip = context.devServer?.ip || 'localhost';
    const port = context.devServer?.port || DEFAULT_PORT;
    publicPath = `//${ip}:${port}/`;
  }

  if (!publicPath.endsWith('/')) {
    publicPath += '/';
  }

  return publicPath;
}

export const PluginOutput = (): BuilderPlugin => ({
  name: 'web-builder-plugin-output',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isProd, isServer, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const jsPath = getDistPath(config, 'js');
      const cssPath = getDistPath(config, 'css');
      const useHash = isProd && !config.output?.disableFilenameHash;
      const hash = useHash ? '.[contenthash:8]' : '';

      const publicPath = getPublicPath({
        config,
        isProd,
        context: api.context,
      });
      const enableExtractCSS = Boolean(config.tools?.cssExtract);

      // js output
      chain.output
        .path(api.context.distPath)
        .filename(`${jsPath}/[name]${hash}.js`)
        .chunkFilename(`${jsPath}/async/[name]${hash}.js`)
        .publicPath(publicPath)
        // since webpack v5.54.0+, hashFunction supports xxhash64 as a faster algorithm
        // which will be used as default when experiments.futureDefaults is enabled.
        .hashFunction('xxhash64');

      // css output
      if (enableExtractCSS) {
        const { default: MiniCssExtractPlugin } = await import(
          'mini-css-extract-plugin'
        );
        const { applyOptionsChain } = await import('@modern-js/utils');
        const extractPluginOptions = applyOptionsChain<
          MiniCSSExtractPluginOptions,
          null
        >({}, config.tools?.cssExtract?.pluginOptions || {});
        const cssChunkName = `${cssPath}/[name]${
          isProd ? '.[contenthash:8]' : ''
        }.css`;
        chain
          .plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT)
          .use(MiniCssExtractPlugin, [
            {
              filename: cssChunkName,
              chunkFilename: cssChunkName,
              ignoreOrder: true,
              ...extractPluginOptions,
            },
          ]);
      }

      // ssr output
      if (isServer) {
        const { SERVER_BUNDLE_DIRECTORY } = await import(
          '@modern-js/utils/constants'
        );
        const filename = `${SERVER_BUNDLE_DIRECTORY}/[name].js`;

        chain.output
          .filename(filename)
          .chunkFilename(filename)
          .libraryTarget('commonjs2');
      }
    });
  },
});
