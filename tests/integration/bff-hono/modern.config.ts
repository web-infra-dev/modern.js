import { bffPlugin } from '@modern-js/plugin-bff';
import { serverPlugin } from '@modern-js/plugin-server';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: true,
  },
  bff: {
    prefix: '/bff-hono',
    enableHandleWeb: true,
    // crossProject: true,
  },
  plugins: [bffPlugin(), serverPlugin()],
});
