import { defineRuntimeConfig } from '@modern-js/runtime';
import { configPlugin } from './plugins/config';

export default defineRuntimeConfig({
  plugins: [configPlugin()],
});
