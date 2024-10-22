import { bffPlugin } from '@modern-js/plugin-bff';
import { koaPlugin } from '@modern-js/plugin-koa';
import { testingPlugin } from '@modern-js/plugin-testing';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/api',
  },
  plugins: [bffPlugin(), testingPlugin(), koaPlugin()],
});
