import PluginAppTools, { defineConfig } from '@modern-js/app-tools';
import PluginTailwindCss from '@modern-js/plugin-tailwindcss';

export default defineConfig({
  plugins: [PluginAppTools(), PluginTailwindCss()],
  source: {
    designSystem: {
      colors: {
        gray: 'red',
      },
    },
  },
});
