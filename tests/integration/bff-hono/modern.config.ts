import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  dev: {
    mockDir: './mocks',
  },
  server: {
    ssr: {
      mode: 'stream',
    },
    // tsconfig.server.json is picked up by convention.
  },
  bff: {
    prefix: '/bff-api',
  },
  plugins: [bffPlugin()],
  security: {
    sri: {
      enable: true,
      hashFuncNames: ['sha256'],
      hashLoading: 'eager',
      algorithm: 'sha256',
    },
  },
});
