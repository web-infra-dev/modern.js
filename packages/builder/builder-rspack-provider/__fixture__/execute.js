const { join } = require('path');

const runBuild = process.argv[2] === 'build';

const createBuilder = async () => {
  const { createBuilder } = require('../../builder');
  // const {
  //   builderWebpackProvider,
  // } = require('../../builder-webpack-provider/dist');
  const { builderRspackProvider } = require('../dist');

  const builderProvider = builderRspackProvider({
    builderConfig: {
      output: {
        distPath: {
          root: 'dist',
        },
        disableSourceMap: true,
        // enableAssetManifest: true,
        // convertToRem: true,
      },
      source: {
        define: {
          NAME: JSON.stringify('Jack'),
        },
      },
      devServer: {
        static: {
          directory: join(process.cwd(), '__fixture__', 'dist'),
        },
      },
    },
  });

  const builder = await createBuilder(builderProvider, {
    cwd: join(process.cwd(), '__fixture__'),
    entry: {
      main: join(process.cwd(), '__fixture__', 'index.js'),
    },
    target: ['web'],
  });

  return builder;
};

(async function main() {
  const builder = await createBuilder();

  try {
    if (runBuild) {
      await builder.build();
    } else {
      await builder.startDevServer();
      // const compiler = await builder.createCompiler();

      // const { RspackDevServer } = require('@rspack/dev-server');
      // const server = new RspackDevServer(compiler);
      // await server.start();
    }
  } catch (err) {
    console.error(err);
  }
})();
