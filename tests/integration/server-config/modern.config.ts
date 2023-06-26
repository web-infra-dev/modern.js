import { appTools, defineConfig } from '@modern-js/app-tools';
import { cliPlugin1 } from './plugins/cliPlugin';

export default defineConfig({
  plugins: [cliPlugin1(), appTools()],
});
