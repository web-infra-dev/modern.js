import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/api-app',
  },
  plugins: [
    expressPlugin(),
    bffPlugin({
      projectType: 'api',
      // fetchDomain: 'http://localhost:8080',
    }),
  ],
});
