import PluginAppTools from '@modern-js/app-tools';

module.exports = {
  source: {
    alias: {
      '@common': './src/common',
      '@components': './src/components',
    },
  },
  runtime: {},
  plugins: [PluginAppTools()],
};
