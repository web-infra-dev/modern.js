import { defineRuntimeConfig } from '@modern-js/runtime';
import { contextPlugin } from './plugins/context';

export default defineRuntimeConfig({
  plugins: [contextPlugin()],
});
