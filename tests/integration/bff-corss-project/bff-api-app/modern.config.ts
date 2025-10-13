import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/api-app',
    crossProject: true,
  },
  plugins: [bffPlugin()],
  server: {
    port: 3399,
  },
  output: {
    distPath: {
      root: 'dist-1',
    },
  },
});
