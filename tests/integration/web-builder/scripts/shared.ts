import { join } from 'path';
import * as WebBuilder from '@modern-js/web-builder';

export const TestPlugin = (): WebBuilder.BuilderPlugin => ({
  name: 'test-plugin',

  setup(api) {
    api.modifyWebpackConfig(config => {
      config.entry = {
        test: join(api.context.srcPath, 'index.js'),
      };
    });
  },
});

export const createBuilder = async () => {
  const cwd = join(__dirname, '..');
  const builder = await WebBuilder.createBuilder({
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
