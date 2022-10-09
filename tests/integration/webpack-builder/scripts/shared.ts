import { join } from 'path';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/builder');
  const { builderWebpackProvider } = await import(
    '@modern-js/builder-webpack-provider'
  );

  const builderProvider = builderWebpackProvider({
<<<<<<< HEAD
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
<<<<<<< HEAD
=======
=======
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
    builderConfig: {
      tools: {
        inspector: {},
      },
    },
>>>>>>> 9dc0232ce (feat(builder): add start url plugin (#1669))
  });

  const builder = await createBuilder(builderProvider, {
    entry: {
      main: join(process.cwd(), 'src', 'index.ts'),
    },
    configPath: __filename,
  });

  return builder;
};
