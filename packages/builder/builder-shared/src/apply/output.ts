import {
  BuilderContext,
  SharedBuilderPluginAPI,
  SharedNormalizedConfig,
} from '../types';
import { getDistPath, getFilename } from '../fs';
import { DEFAULT_PORT } from '../constants';
import { addTrailingSlash } from '../utils';

export function applyBuilderOutputPlugin(api: SharedBuilderPluginAPI) {
  api.modifyBundlerChain(
    async (chain, { isProd, isServer, isServiceWorker }) => {
      const config = api.getNormalizedConfig();
      const jsPath = getDistPath(config.output, 'js');

      const publicPath = getPublicPath({
        config,
        isProd,
        context: api.context,
      });

      // js output
      const jsFilename = getFilename(config.output, 'js', isProd);

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

      if (isServer) {
        const serverPath = getDistPath(config.output, 'server');
        const filename = `${serverPath}/[name].js`;

        chain.output
          .filename(filename)
          .chunkFilename(filename)
          .libraryTarget('commonjs2');
      }

      if (isServiceWorker) {
        const workerPath = getDistPath(config.output, 'worker');
        const filename = `${workerPath}/[name].js`;

        chain.output
          .filename(filename)
          .chunkFilename(filename)
          .libraryTarget('commonjs2');
      }
    },
  );
}

function getPublicPath({
  config,
  isProd,
  context,
}: {
  config: SharedNormalizedConfig;
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
