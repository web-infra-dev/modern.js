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
  devtool: genMockPlugin('builder-plugin-devtool'),
  entry: genMockPlugin('builder-plugin-entry'),
  cache: genMockPlugin('builder-plugin-cache'),
  yaml: genMockPlugin('builder-plugin-yaml'),
  toml: genMockPlugin('builder-plugin-toml'),
  splitChunks: genMockPlugin('builder-plugin-split-chunks'),
  bundleAnalyzer: genMockPlugin('builder-plugin-bundle-analyzer'),
};
