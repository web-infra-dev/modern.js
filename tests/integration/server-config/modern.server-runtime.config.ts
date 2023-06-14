import { defineConfig } from '@modern-js/app-tools/server';
import plugin1 from './plugins/serverPlugin';

export default defineConfig({
  bff: {
    proxy: {
      '/api/proxy': {
        // https://github.com/chimurai/http-proxy-middleware/issues/705
        target: `http://127.0.0.1:${process.env.PORT}`,
        pathRewrite: { '/api/proxy': '/api/foo' },
        changeOrigin: true,
      },
    },
  },
  plugins: [plugin1()],
});
