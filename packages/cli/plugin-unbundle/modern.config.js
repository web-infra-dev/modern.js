/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  source: {
    entries: {
      main: './src/index.ts',
      injectErrorOverlay: './src/client/error-overlay.ts',
      injectClientIndex: './src/client/index.ts',
    },
  },
};
