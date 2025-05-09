import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      mode: 'stream',
    },
  },
  runtime: {
    router: true,
  },
  bff: {
    prefix: '/bff-api',
  },
  plugins: [bffPlugin()],
});
