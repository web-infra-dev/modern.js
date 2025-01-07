import { serverPlugin } from '@modern-js/plugin-server';
import { applyBaseConfig } from '../../../utils/applyBaseConfig';

export default applyBaseConfig({
  plugins: [serverPlugin()],
  runtime: {
    router: false,
    state: false,
  },
  server: {
    routes: {
      pc: '/',
      mobile: '/',
      home: '/rewrite',
      entry: '/redirect',
    },
  },
});
