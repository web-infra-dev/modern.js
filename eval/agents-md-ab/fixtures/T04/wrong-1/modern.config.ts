import { appTools, defineConfig } from '@modern-js/app-tools';

// WRONG: changes the html subdir, not the output root
export default defineConfig({
  plugins: [appTools()],
  output: {
    distPath: {
      html: 'build_output',
    },
  },
});
