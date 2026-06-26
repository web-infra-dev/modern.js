import { defineRuntimeConfig } from '@modern-js/runtime';
import { existingPlugin } from './plugins';

export default defineRuntimeConfig({
  plugins: [existingPlugin()],
});
