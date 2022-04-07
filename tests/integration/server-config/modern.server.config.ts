import { defineServerConfig } from '@modern-js/app-tools';
import plugin1 from './plugins/serverPlugin';

export default defineServerConfig({
  bff: {
    proxy: {
      '/bff': {
        target: 'https://api.github.com',
        pathRewrite: { '/bff/modernjs': '/repos/modern-js-dev/modern.js' },
        changeOrigin: true,
      },
    },
  },
  plugins: [plugin1()],
});
