import { ssgPlugin } from '@modern-js/plugin-ssg';
import { applyBaseConfig } from '../../../../utils/applyBaseConfig';

export default applyBaseConfig({
  runtime: true,
  output: {
    ssg: true,
  },
  plugins: [ssgPlugin()],
});
