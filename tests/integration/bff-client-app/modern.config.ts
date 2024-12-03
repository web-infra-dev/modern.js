import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { serverPlugin } from 'bff-api-app/server-plugin';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/web-app',
  },
  server: {
    ssr: true,
  },
  plugins: [bffPlugin(), expressPlugin(), serverPlugin()],
  // plugins: [bffPlugin(), expressPlugin()],
});
