import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginTailWindCss from '@modern-js/plugin-tailwindcss';

export default defineConfig({
  source: {
    designSystem: {
      colors: {
        gray: 'red',
      },
    },
  },
  plugins: [PluginAppTools(), PluginTailWindCss()],
});
