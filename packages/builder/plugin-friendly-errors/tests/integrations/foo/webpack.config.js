/** @type {import('webpack5').Configuration} */
module.exports = {
  mode: 'development',
  entry: `${__dirname}/index.js`,
  output: {
    path: `${__dirname}/dist`,
    filename: 'bundle.js',
  },
};
