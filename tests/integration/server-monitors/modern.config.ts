import { serverPlugin } from '@modern-js/plugin-server';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  plugins: [serverPlugin()],
  server: {
    ssr: {
      disablePrerender: true,
    },
  },
  runtime: {
    router: true,
    state: false,
  },
});
