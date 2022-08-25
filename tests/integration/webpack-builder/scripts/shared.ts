import { join } from 'path';
import { InspectorWebpackPlugin } from '@modern-js/inspector-webpack-plugin';
import type { BuilderPlugin } from '../../../../packages/builder/webpack-builder/src';

export const TestPlugin = (): BuilderPlugin => ({
  name: 'test-plugin',

  setup(api) {
    api.modifyWebpackConfig(config => {
      // Webpack devtool
      config.plugins?.push(new InspectorWebpackPlugin());
    });
  },
});

export const createBuilder = async () => {
  const { createBuilder } = await import(
    '../../../../packages/builder/webpack-builder/src'
  );

  const cwd = join(__dirname, '..');
  const entry = {
    main: join(cwd, 'src', 'index.ts'),
  };

  const builder = await createBuilder({
    cwd,
    entry,
    configPath: __filename,
    builderConfig: {},
  });

  builder.addPlugins([TestPlugin()]);

  return {
    cwd,
    builder,
  };
};
