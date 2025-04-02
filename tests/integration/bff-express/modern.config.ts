import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  server: {
    ssr: true,
  },
  bff: {
    prefix: '/bff-api',
    crossProject: true,
  },
  plugins: [bffPlugin(), expressPlugin()],
});
