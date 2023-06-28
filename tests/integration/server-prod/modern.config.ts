import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: false,
    state: false,
  },
  output: {
    copy: [{ from: './src/assets', to: '' }],
  },
  plugins: [appTools()],
});
