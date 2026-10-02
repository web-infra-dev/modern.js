import { appTools, defineConfig } from '@modern-js/app-tools';
import { styledComponentsPlugin } from '@modern-js/plugin-styled-components';

export default defineConfig({
  plugins: [appTools(), styledComponentsPlugin()],
});
