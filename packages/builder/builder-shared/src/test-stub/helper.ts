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
  inlineChunk: genMockPlugin('builder-plugin-inline-chunk'),
  bundleAnalyzer: genMockPlugin('builder-plugin-bundle-analyzer'),
  assetsRetry: genMockPlugin('builder-plugin-assets-retry'),
  font: genMockPlugin('builder-plugin-font'),
  media: genMockPlugin('builder-plugin-media'),
  image: genMockPlugin('builder-plugin-image'),
  svg: genMockPlugin('builder-plugin-svg'),
  html: genMockPlugin('builder-plugin-html'),
  antd: genMockPlugin('antd'),
  arco: genMockPlugin('arco'),
  tsChecker: genMockPlugin('builder-plugin-ts-checker'),
  checkSyntax: genMockPlugin('builder-plugin-check-syntax'),
  rem: genMockPlugin('builder-plugin-rem'),
  wasm: genMockPlugin('builder-plugin-wasm'),
  moment: genMockPlugin('builder-plugin-moment'),
  externals: genMockPlugin('builder-plugin-externals'),
  sourceBuild: genMockPlugin('builder-plugin-source-build'),
};
