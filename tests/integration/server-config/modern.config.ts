import appTools, { defineConfig } from '@modern-js/app-tools';
import plugin1 from './plugins/cliPlugin';

export default defineConfig({
  plugins: [plugin1(), appTools()],
});
