import { join } from 'path';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/webpack-builder');

  const builder = await createBuilder({
    entry: {
      main: join(process.cwd(), 'src', 'index.ts'),
    },
    configPath: __filename,
    builderConfig: {
      tools: {
        // inspector: {},
      },
    },
  });

  return builder;
};
