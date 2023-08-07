const path = require('path');

module.exports = {
  slow: 1,
  require: [require.resolve('tsm'), 'module-alias/register'],
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  // FIXME:configs test snapshot will not match in windows
  spec: [path.join(__dirname, '{errors,fixtures,plugins}/**/*.{spec,test}.*')],
  timeout: 100000,
};
