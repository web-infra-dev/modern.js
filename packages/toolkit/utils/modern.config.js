/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  output: {
    disableSourceMap: true,
  },
  tools: {
    jest: {
      modulePathIgnorePatterns: [
        '<rootDir>/tests/fixtures/import/.*/package.json',
      ],
    },
  },
};
