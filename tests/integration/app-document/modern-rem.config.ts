import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  html: {
    favicon: './static/a.icon',
  },
  source: {
    alias: {
      '@aliasTest': './src/utils/aliasModule',
    },
  },
  output: {
    distPath: {
      root: 'dist-1',
    },
    convertToRem: {
      inlineRuntime: false,
    },
  },
  performance: {
    buildCache: false,
  },
});
