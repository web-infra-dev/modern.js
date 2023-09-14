import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: true,
  },
  bff: {
    prefix: '/bff-api',
  },
  plugins: [bffPlugin(), expressPlugin()],
});
