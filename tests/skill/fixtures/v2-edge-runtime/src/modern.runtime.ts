import { defineRuntimeConfig } from '@modern-js/runtime';
import { existingPlugin } from './existing-plugin';

export default defineRuntimeConfig({
  plugins: [existingPlugin()],
});
