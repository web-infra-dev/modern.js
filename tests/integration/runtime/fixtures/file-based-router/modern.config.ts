import { routerPlugin } from '@modern-js/plugin-router-v5';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: {
      mode: 'react-router-5',
    },
  },
  plugins: [routerPlugin()],
});
