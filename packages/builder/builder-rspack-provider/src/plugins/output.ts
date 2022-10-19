import { DEFAULT_PORT, type BuilderContext } from '@modern-js/builder-shared';
import { getDistPath, getFilename } from '../shared';
import type {
  RspackConfig,
  BuilderConfig,
  BuilderPlugin,
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
    api.modifyRspackConfig(async (rspackConfig, { isProd, isServer, CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      const jsPath = getDistPath(config, 'js');

      const publicPath = getPublicPath({
        config,
        isProd,
        context: api.context,
      });

      // js output
      const jsFilename = getFilename(config, 'js', isProd);

      const defaultOutput: RspackConfig['output'] = {
        path: api.context.distPath,
        filename: `${jsPath}/${jsFilename}`,
        chunkFilename: `${jsPath}/async/${jsFilename}`,
        publicPath
      };

      rspackConfig.output = defaultOutput;
    });
  },
});
