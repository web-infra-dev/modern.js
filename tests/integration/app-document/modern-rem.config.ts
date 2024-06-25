import { routerPlugin } from '@modern-js/plugin-router-v5';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
    state: true,
  },
  source: {
    entries: {
      sub: './src/sub/pages',
      test: './src/test/App.tsx',
    },
  },
  html: {
    favicon: './static/a.icon',
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
  plugins: [routerPlugin()],
});
