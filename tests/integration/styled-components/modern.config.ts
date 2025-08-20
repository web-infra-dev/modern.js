import { styledComponentsPlugin } from '@modern-js/plugin-styled-components';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  server: {
    ssr: {
      mode: 'stream',
    },
    // ssr: true,
  },
  plugins: [styledComponentsPlugin()],
});
