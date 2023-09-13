import { applyBaseConfig } from '../../utils/applyBaseConfig';
import { cliPlugin1 } from './plugins/cliPlugin';

export default applyBaseConfig({
  plugins: [cliPlugin1()],
});
