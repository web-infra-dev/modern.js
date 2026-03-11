import path from 'node:path';
import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  source: {
    alias: {
      '@my-src': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [bffPlugin()],
  output: {
    disableTsChecker: true, // 关闭 TypeScript 类型检查
  },
  bff: {
    prefix: '/bff-api',
  },
  server: {
    port: 8088,
  },
  dev: process.env.BFF_PROXY
    ? {
        server: {
          proxy: {
            '/bff-api': 'http://localhost:8088',
          },
        },
      }
    : {},
});
