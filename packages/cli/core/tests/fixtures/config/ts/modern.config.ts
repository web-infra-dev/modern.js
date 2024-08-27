import { runtime, source } from './dep-a';

const config = {
  source,
  runtime,
  tools: { webpack: (webpackConfig: any) => (webpackConfig.devtool = null) },
};

export default config;
