import {
  DEFAULT_PORT,
  addTrailingSlash,
  getDistPath,
  getFilename,
  type BuilderContext,
} from '@modern-js/builder-shared';
import type { BuilderPlugin, NormalizedConfig } from '../types';
import { isUseCssExtract } from '../shared';

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

  return addTrailingSlash(publicPath);
}

export const builderPluginOutput = (): BuilderPlugin => ({
  name: 'builder-plugin-output',

  setup(api) {
    api.modifyRspackConfig(
      async (rspackConfig, { isProd, isServer, target }) => {
        const config = api.getNormalizedConfig();
        const jsPath = getDistPath(config.output, 'js');

        const publicPath = getPublicPath({
          config,
          isProd,
          context: api.context,
        });

        // js output
        const jsFilename = getFilename(config.output, 'js', isProd);

        rspackConfig.output = {
          path: api.context.distPath,
          filename: `${jsPath}/${jsFilename}`,
          chunkFilename: `${jsPath}/async/${jsFilename}`,
          publicPath,
          hashFunction: 'xxhash64',
        };

        // css output
        if (isUseCssExtract(config, target)) {
          const cssPath = getDistPath(config.output, 'css');
          const cssFilename = getFilename(config.output, 'css', isProd);

          rspackConfig.output.cssFilename = `${cssPath}/${cssFilename}`;
          rspackConfig.output.cssChunkFilename = `${cssPath}/async/${cssFilename}`;
        }

        // server output
        if (isServer) {
          const serverPath = getDistPath(config.output, 'server');
          const filename = `${serverPath}/[name].js`;

          rspackConfig.output = {
            path: api.context.distPath,
            filename,
            chunkFilename: filename,
            // todo
            // libraryTarget: 'commonjs2',
            publicPath,
            hashFunction: 'xxhash64',
          };
        }
      },
    );
  },
});
