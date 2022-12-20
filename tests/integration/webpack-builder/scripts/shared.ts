import { join } from 'path';

const runType = process.argv[2] || 'webpack';

const getRspackProvider = async () => {
  const { builderRspackProvider } = await import(
    '@modern-js/builder-rspack-provider'
  );
  return builderRspackProvider;
};

const getWebpackProvider = async () => {
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );
  return builderWebpackProvider;
};

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/builder');
  const provider =
    runType === 'rspack'
      ? await getRspackProvider()
      : await getWebpackProvider();

  const builderProvider = provider({
    builderConfig: {
      tools: {
        // inspector: {},
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

  if (process.env.ESBUILD) {
    const { EsbuildPlugin } = await import('@modern-js/builder-plugin-esbuild');
    builder.addPlugins([EsbuildPlugin()]);
  }

  if (process.env.SWC) {
    const { SwcPlugin } = await import('@modern-js/builder-plugin-swc');
    builder.addPlugins([SwcPlugin()]);
  }

  return builder;
};
