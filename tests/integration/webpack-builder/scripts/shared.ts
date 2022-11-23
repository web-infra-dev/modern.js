import { join } from 'path';

const runRspack = process.argv[2] === 'rspack';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );

  const { builderRspackProvider } = await import(
    '@modern-js/builder-rspack-provider'
  );

  const builderProvider = (
    runRspack ? builderRspackProvider : builderWebpackProvider
  )({
    builderConfig: {
      tools: {
        devServer: {
          hot: true,
          liveReload: true,
        },
      },
      output: {
        disableSourceMap: true,
        // cleanDistPath: false,
      },
    },
  });

  const builder = await createBuilder(builderProvider, {
    entry: {
      main: join(process.cwd(), 'src', 'index.ts'),
    },
    target: ['web'],
    configPath: __filename,
  });

  return builder;
};
