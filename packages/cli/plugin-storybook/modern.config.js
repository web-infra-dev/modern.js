/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  output: {
    copy: [
      {
        from: './template',
        to: '',
      },
    ],
    // enableTsChecker: true,
    disableSourceMap: true,
  },
};
