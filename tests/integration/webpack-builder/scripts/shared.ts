import { join } from 'path';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );
  const { PluginSwc } = await import('@modern-js/builder-plugin-swc');

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

  builder.addPlugins([PluginSwc()]);

  return builder;
};
