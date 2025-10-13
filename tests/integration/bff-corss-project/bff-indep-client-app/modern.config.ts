import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: false,
  },
  plugins: [bffPlugin()],
});
