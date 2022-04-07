import { defineConfig } from '@modern-js/app-tools';
import plugin1 from './plugins/cliPlugin';

export default defineConfig({
  output: {
    enableInlineScripts: true,
  },
  plugins: [plugin1()],
});
