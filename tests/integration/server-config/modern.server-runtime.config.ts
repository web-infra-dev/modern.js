import { defineConfig } from '@modern-js/app-tools/server';
import plugin1 from './plugins/serverPlugin';

export default defineConfig({
  plugins: [plugin1()],
});
