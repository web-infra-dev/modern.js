import { defineConfig } from '@modern-js/app-tools';
import config from './modern.config';

export default defineConfig({
  ...config,
  output: {
    ...config.output,
    ssgByEntries: {
      index: { routes: ['/user', '/user/missing', '/user/1'] },
    },
  },
});
