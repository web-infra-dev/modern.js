import { testingPlugin } from '@modern-js/plugin-testing';
import { applyBaseConfig } from '../../utils/applyBaseConfig';

export default applyBaseConfig({
  plugins: [testingPlugin()],
});
