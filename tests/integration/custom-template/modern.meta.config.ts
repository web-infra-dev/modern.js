import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  html: {
    template: './src/index.html',
    meta: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      'format-detection': 'telephone=no',
    },
  },
  output: {
    distPath: {
      root: 'dist/meta',
    },
  },
});
