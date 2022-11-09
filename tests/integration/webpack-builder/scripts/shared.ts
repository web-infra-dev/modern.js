import { join } from 'path';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );

  const builderProvider = builderWebpackProvider({
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
