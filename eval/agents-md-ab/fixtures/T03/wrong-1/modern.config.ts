import { appTools, defineConfig } from '@modern-js/app-tools';

// WRONG: ssr does not live at the top level of the config
export default defineConfig({
  plugins: [appTools()],
  ssr: true,
} as any);
