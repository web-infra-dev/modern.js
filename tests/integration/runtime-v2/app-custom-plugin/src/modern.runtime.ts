import { defineConfig } from '@modern-js/runtime-v2';
import { contextPlugin } from './plugins/context';

export default defineConfig({
  plugins: [contextPlugin()],
});
