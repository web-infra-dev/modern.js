import { DEFAULT_PORT } from '../shared';
import type { BuilderConfig, BuilderContext, BuilderPlugin } from '../types';

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
    api.modifyWebpackChain(async (chain, { isProd, isServer }) => {
      const config = api.getBuilderConfig();
      const { distPath } = config.output || {};
      const jsPath = (typeof distPath === 'object' && distPath.js) || 'js';
      const useHash = isProd && !config.output?.disableFilenameHash;
      const hash = useHash ? '.[contenthash:8]' : '';

      const publicPath = getPublicPath({
        config,
        isProd,
        context: api.context,
      });

      chain.output
        .path(api.context.distPath)
        .filename(`${jsPath}/[name]${hash}.js`)
        .chunkFilename(`${jsPath}/async/[name]${hash}.js`)
        .publicPath(publicPath)
        // since webpack v5.54.0+, hashFunction supports xxhash64 as a faster algorithm
        // which will be used as default when experiments.futureDefaults is enabled.
        .hashFunction('xxhash64');

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
