import { serverPlugin } from '@modern-js/plugin-server';
import { ssgPlugin } from '@modern-js/plugin-ssg';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  output: {
    ssg: true,
  },
  plugins: [ssgPlugin(), serverPlugin()],
});
