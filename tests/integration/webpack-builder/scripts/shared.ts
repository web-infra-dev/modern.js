import { join } from 'path';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );

  const builderProvider = builderWebpackProvider({
    builderConfig: {
      tools: {
        inspector: {},
        devServer: {
          headers: {
            'X-Custom-Foo': 'bar',
          },
        },
      },
    },
  });

  const builder = await createBuilder(builderProvider, {
    entry: {
      main: join(process.cwd(), 'src', 'index.ts'),
    },
    configPath: __filename,
  });

  return builder;
};
