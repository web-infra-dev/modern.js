import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    state: true,
  },
  output: {
    disableTsChecker: true,
  },
  html: {
    tags: tags => {
      tags.push({ tag: 'script', attrs: { src: 'foooo.js' } });
    },
    tagsByEntries: {
      main: [{ tag: 'script', attrs: { src: 'bar.js' } }],
    },
  },
  plugins: [AppToolsPlugin()],
});
