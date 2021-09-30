/* eslint-disable filenames/match-exported */
import { source, runtime } from './dep-a';

const config = {
  source,
  runtime,
  tools: { webpack: (webpackConfig: any) => (webpackConfig.devtool = null) },
};

export default config;
/* eslint-enable filenames/match-exported */
