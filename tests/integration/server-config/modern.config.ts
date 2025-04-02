import { bffPlugin } from '@modern-js/plugin-bff';
import { applyBaseConfig } from '../../utils/applyBaseConfig';
import { cliPlugin1 } from './plugins/cliPlugin';

export default applyBaseConfig({
  runtime: true,
  plugins: [cliPlugin1(), bffPlugin()],
});
