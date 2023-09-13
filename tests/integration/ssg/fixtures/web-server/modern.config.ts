import { ssgPlugin } from '@modern-js/plugin-ssg';
import { serverPlugin } from '@modern-js/plugin-server';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  output: {
    ssg: true,
  },
  plugins: [ssgPlugin(), serverPlugin()],
});
