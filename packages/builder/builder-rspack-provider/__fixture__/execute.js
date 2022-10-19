const { join } = require('path');

const createBuilder = async () => {
  const { createBuilder } = require('../../builder');
  const { builderRspackProvider } = require('../dist');

  const builderProvider = builderRspackProvider({
    builderConfig: {
      output: {
        distPath: {
          root: join(process.cwd(), '__fixture__', 'dist')
        },
        convertToRem: true
      },
      source: {
        define: {
          NAME: "Jack"
        }
      },
      tools: {
        // inspector: {},
      },
    },
  });

  const builder = await createBuilder(builderProvider, {
    entry: {
      main: join(process.cwd(), '__fixture__', 'index.js'),
    },
    output: {
      //custom publicPath
    },
    target: ['web'],
  });

  return builder;
};

new Promise(async (resolve) => {
  const builder = await createBuilder();
  const compiler = await builder.createCompiler();
  const stats = await compiler.build();
  console.log('render compile successfully');
  console.log(stats);
})
