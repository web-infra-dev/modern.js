const { join } = require('path');

const runType = process.argv[2] || 'dev';

const createBuilder = async () => {
  const { createBuilder } = require('../../builder');
  const { builderRspackProvider } = require('../dist');

  const builderProvider = builderRspackProvider({
    builderConfig: {
      source: {
        define: {
          NAME: '"modern"',
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
    switch (runType) {
      case 'build':
        await builder.build();
        break;
      case 'inspect':
        await builder.inspectConfig({ writeToDisk: true });
        break;
      default:
        await builder.startDevServer();
    }
  } catch (err) {
    console.error(err);
  }
})();
