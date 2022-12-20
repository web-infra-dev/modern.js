import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [AppToolsPlugin()],
  output: {
    enableCssModuleTSDeclaration: true,
  },
});
