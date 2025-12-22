import { styledComponentsPlugin } from '@modern-js/plugin-styled-components';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  server: {
    ssr: {
      mode: 'string',
    },
  },
  plugins: [styledComponentsPlugin()],
});
