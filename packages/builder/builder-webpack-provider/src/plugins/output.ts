import {
  CssExtractOptions,
  MiniCSSExtractPluginOptions,
} from '../types/thirdParty/css';
import { DEFAULT_PORT, type BuilderContext } from '@modern-js/builder-shared';
import { getDistPath, getFilename } from '../shared';
import type { BuilderPlugin, NormalizedConfig } from '../types';

function getPublicPath({
  config,
  isProd,
  context,
}: {
  config: NormalizedConfig;
  isProd: boolean;
  context: BuilderContext;
}) {
  const { dev, output } = config;

  let publicPath = '/';

  if (isProd) {
    if (output.assetPrefix) {
      publicPath = output.assetPrefix;
    }
  } else if (typeof dev.assetPrefix === 'string') {
    publicPath = dev.assetPrefix;
  } else if (dev.assetPrefix === true) {
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
      const config = api.getNormalizedConfig();
      const jsPath = getDistPath(config, 'js');
      const cssPath = getDistPath(config, 'css');

      const publicPath = getPublicPath({
        config,
        isProd,
        context: api.context,
      });

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
      const enableExtractCSS =
        config.tools.cssExtract !== false &&
        !config.tools.styleLoader &&
        !isServer;
      if (enableExtractCSS) {
        const { default: MiniCssExtractPlugin } = await import(
          'mini-css-extract-plugin'
        );
        const { applyOptionsChain } = await import('@modern-js/utils');
        const extractPluginOptions = applyOptionsChain<
          MiniCSSExtractPluginOptions,
          null
        >(
          {},
          (config.tools.cssExtract as CssExtractOptions)?.pluginOptions || {},
        );

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

      // server output
      if (isServer) {
        const serverPath = getDistPath(config, 'server');
        const filename = `${serverPath}/[name].js`;

        chain.output
          .filename(filename)
          .chunkFilename(filename)
          .libraryTarget('commonjs2');
      }
    });
  },
});
