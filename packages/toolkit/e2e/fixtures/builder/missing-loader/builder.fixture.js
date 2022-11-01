const path = require('path');

/** @type {import('@modern-js/builder-webpack-provider/stub').StubBuilderOptions} */
module.exports = {
  context: {
    rootPath: __dirname,
  },
  builderConfig: {
    dev: {
      startUrl: 'http://www.example.com',
    },
  },
  entry: {
    main: './index.js',
  },
};
