import { defineConfig } from '@modern-js/app-tools/server';
import plugin1 from './plugins/serverPlugin';

export default defineConfig({
  bff: {
    proxy: {
      '/api/proxy': {
        target: `http://localhost:${process.env.PORT}`,
        pathRewrite: { '/api/proxy': '/api/foo' },
        changeOrigin: true,
      },
    },
  },
  plugins: [plugin1()],
});
