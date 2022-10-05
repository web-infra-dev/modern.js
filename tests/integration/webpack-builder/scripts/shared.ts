import { join } from 'path';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/builder');
  const { webpackBuildProvider } = await import('@modern-js/webpack-builder');

  const builderProvider = webpackBuildProvider({
    builderConfig: {
      tools: {
        inspector: {},
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
