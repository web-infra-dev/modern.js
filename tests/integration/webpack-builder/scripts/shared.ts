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
        rspack: config => {
          config.optimization = {
            ...(config.optimization || {}),
            splitChunks: {
              chunks: 'all',
              cacheGroups: {
                vendors: {
                  name: 'vendors',
                  test: /node_modules/,
                  enforce: true,
                },
              },
            },
          };
        },
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
    const { PluginEsbuild } = await import('@modern-js/builder-plugin-esbuild');
    builder.addPlugins([PluginEsbuild()]);
  }

  if (process.env.SWC) {
    const { PluginSwc } = await import('@modern-js/builder-plugin-swc');
    builder.addPlugins([PluginSwc()]);
  }

  return builder;
};
