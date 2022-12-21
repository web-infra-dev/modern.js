import { Plugins } from '../types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const setup = () => {};

const genMockPlugin = (name: string) => () =>
  Promise.resolve({
    name,
    setup,
  });

export const mockBuilderPlugins: Plugins = {
  cleanOutput: genMockPlugin('builder-plugin-clean-output'),
  startUrl: genMockPlugin('builder-plugin-start-url'),
  fileSize: genMockPlugin('builder-plugin-file-size'),
  target: genMockPlugin('builder-plugin-target'),
  devtool: () =>
    Promise.resolve({
      name: 'builder-plugin-devtool',
      setup: api => {
        api.modifyBundlerChain((chain: any) => {
          // test modifyBundlerChain work correctly
          chain.devtool('cheap-module-source-map');
        });
      },
    }),
};
