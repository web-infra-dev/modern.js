import { serverPlugin } from '@modern-js/plugin-server';
import { applyBaseConfig } from '../../../utils/applyBaseConfig';

export default applyBaseConfig({
  plugins: [serverPlugin()],
  runtime: {
    router: true,
    state: false,
  },
  server: {
    ssr: true,
  },
});
