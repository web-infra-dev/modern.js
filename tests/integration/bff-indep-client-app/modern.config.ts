import { bffPlugin } from '@modern-js/plugin-bff';
import { expressPlugin } from '@modern-js/plugin-express';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/indep-web-app',
  },
  server: {
    ssr: true,
    port: 3400,
  },
  plugins: [bffPlugin(), expressPlugin()],
});
