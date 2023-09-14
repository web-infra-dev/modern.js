import { bffPlugin } from '@modern-js/plugin-bff';
import { testingPlugin } from '@modern-js/plugin-testing';
import { koaPlugin } from '@modern-js/plugin-koa';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  bff: {
    prefix: '/api',
  },
  plugins: [bffPlugin(), testingPlugin(), koaPlugin()],
});
