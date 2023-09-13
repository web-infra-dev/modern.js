import { devtoolsPlugin } from '@modern-js/plugin-devtools';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: {
    router: true,
  },
  performance: {
    buildCache: false,
  },
  plugins: [devtoolsPlugin()],
});
