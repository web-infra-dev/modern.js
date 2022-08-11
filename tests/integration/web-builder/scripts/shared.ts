import { join } from 'path';
import { InspectorWebpackPlugin } from '@modern-js/inspector-webpack-plugin';
import type { BuilderPlugin } from '../../../../packages/builder/web-builder/src';

export const TestPlugin = (): BuilderPlugin => ({
  name: 'test-plugin',

  setup(api) {
    api.modifyWebpackConfig(config => {
      config.entry = {
        test: join(api.context.srcPath, 'index.ts'),
      };
      // Webpack devtool
      config.plugins?.push(new InspectorWebpackPlugin());
    });
  },
});

export const createBuilder = async () => {
  const { createBuilder } = await import(
    '../../../../packages/builder/web-builder/src'
  );

  const cwd = join(__dirname, '..');
  const builder = await createBuilder({
    cwd,
    configPath: __filename,
    builderConfig: {
      tools: {
        tsLoader: {
          compilerOptions: {
            strictNullChecks: true,
          },
        },
      },
    },
  });

  builder.addPlugins([TestPlugin()]);

  return {
    cwd,
    builder,
  };
};
