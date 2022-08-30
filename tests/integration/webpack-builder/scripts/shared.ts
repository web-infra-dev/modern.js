import { join } from 'path';
import { InspectorWebpackPlugin } from '@modern-js/inspector-webpack-plugin';

export const createBuilder = async () => {
  const { createBuilder } = await import('@modern-js/webpack-builder');

  const builder = await createBuilder({
    entry: {
      main: join(process.cwd(), 'src', 'index.ts'),
    },
    configPath: __filename,
    builderConfig: {},
  });

  builder.addPlugins([
    {
      name: 'inspect-plugin',
      setup(api) {
        api.modifyWebpackConfig(config => {
          // Webpack devtool
          config.plugins?.push(new InspectorWebpackPlugin());
        });
      },
    },
  ]);

  return builder;
};
