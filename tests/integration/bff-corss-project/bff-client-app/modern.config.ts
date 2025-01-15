import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { crossProjectApiPlugin } from 'bff-api-app/plugin';
import { applyBaseConfig } from '../../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/web-app',
  },
  server: {
    ssr: true,
    port: 3401,
  },
  plugins: [bffPlugin(), expressPlugin(), crossProjectApiPlugin()],
});
