import { join } from 'path';

const runType = process.argv[2] || 'webpack';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );

  const { builderRspackProvider } = await import(
    '@modern-js/builder-rspack-provider'
  );

  const builderProvider = (
    runType === 'rspack' ? builderRspackProvider : builderWebpackProvider
  )({
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
    const { PluginEsbuild } = await import('@modern-js/builder-plugin-esbuild');
    builder.addPlugins([PluginEsbuild()]);
  }

  if (process.env.SWC) {
    const { PluginSwc } = await import('@modern-js/builder-plugin-swc');
    builder.addPlugins([PluginSwc()]);
  }

  return builder;
};
