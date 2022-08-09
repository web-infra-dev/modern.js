import { join } from 'path';
import type { BuilderPlugin } from '../../../../packages/builder/web-builder/src';

export const TestPlugin = (): BuilderPlugin => ({
  name: 'test-plugin',

  setup(api) {
    api.modifyWebpackConfig(config => {
      config.entry = {
        test: join(api.context.srcPath, 'index.ts'),
      };
      config.resolve = {
        extensions: ['.ts', '.js', '.tsx', '.jsx', '.json'],
      };
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
    builderConfig: {},
  });

  builder.addPlugins([TestPlugin()]);

  return {
    cwd,
    builder,
  };
};
