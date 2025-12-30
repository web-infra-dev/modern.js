import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      mode: 'stream',
    },
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
