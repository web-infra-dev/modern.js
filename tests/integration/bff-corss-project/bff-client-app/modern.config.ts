import { bffPlugin } from '@modern-js/plugin-bff';
import { crossProjectApiPlugin } from 'bff-api-app/plugin';
import { applyBaseConfig } from '../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: false,
    port: 3401,
  },
  plugins: [bffPlugin(), crossProjectApiPlugin()],
});
