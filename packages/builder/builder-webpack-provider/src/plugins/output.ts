<<<<<<< HEAD
import { DEFAULT_PORT, type BuilderContext } from '@modern-js/builder-shared';
import { getDistPath, getFilename } from '../shared';
=======
import type { BuilderContext } from '@modern-js/builder-shared';
import { getDistPath, getFilename, DEFAULT_PORT } from '../shared';
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
import type {
  BuilderConfig,
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
    const hostname = context.devServer?.hostname || 'localhost';
    const port = context.devServer?.port || DEFAULT_PORT;
    publicPath = `//${hostname}:${port}/`;
  }

  if (!publicPath.endsWith('/')) {
    publicPath += '/';
  }

  return publicPath;
}

export const PluginOutput = (): BuilderPlugin => ({
  name: 'builder-plugin-output',

  setup(api) {
    api.modifyWebpackChain(async (chain, { isProd, isServer, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const jsPath = getDistPath(config, 'js');
      const cssPath = getDistPath(config, 'css');

      const publicPath = getPublicPath({
        config,
        isProd,
        context: api.context,
      });
      const enableExtractCSS = !config.tools?.styleLoader;

      // js output
      const jsFilename = getFilename(config, 'js', isProd);
      chain.output
        .path(api.context.distPath)
        .filename(`${jsPath}/${jsFilename}`)
        .chunkFilename(`${jsPath}/async/${jsFilename}`)
        .publicPath(publicPath)
        // disable pathinfo to improve compile performance
        // the path info is useless in most cases
        // see: https://webpack.js.org/guides/build-performance/#output-without-path-info
        .pathinfo(false)
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

        const cssFilename = getFilename(config, 'css', isProd);

        chain
          .plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT)
          .use(MiniCssExtractPlugin, [
            {
              filename: `${cssPath}/${cssFilename}`,
              chunkFilename: `${cssPath}/async/${cssFilename}`,
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
