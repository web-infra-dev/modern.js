import { serverPlugin } from '@byted/bff-api-app/server-plugin';
import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/web-app',
  },
  plugins: [bffPlugin(), expressPlugin(), serverPlugin()],
  // plugins: [bffPlugin(), expressPlugin()],
});
