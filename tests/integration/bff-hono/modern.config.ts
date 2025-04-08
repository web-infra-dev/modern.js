import { bffPlugin } from '@modern-js/plugin-bff';
import { serverPlugin } from '@modern-js/plugin-server';
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
  plugins: [bffPlugin(), serverPlugin()],
});
