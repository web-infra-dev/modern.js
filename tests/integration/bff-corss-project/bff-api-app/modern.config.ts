import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { applyBaseConfig } from '../../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/api-app',
    crossProject: true,
  },
  plugins: [expressPlugin() as any, bffPlugin()],
  server: {
    port: 3399,
  },
  output: {
    distPath: {
      root: 'dist-1',
    },
  },
});
