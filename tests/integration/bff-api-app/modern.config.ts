import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/api-app',
    enableCrossProjectInvocation: true,
  },
  plugins: [expressPlugin(), bffPlugin()],
  server: {
    port: 3399,
  },
  output: {
    distPath: {
      root: 'dist-1',
    },
  },
});
