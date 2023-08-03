const path = require('path');

module.exports = {
  slow: 1,
  require: [require.resolve('tsm'), 'module-alias/register'],
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  spec: [path.join(__dirname, './**/*.{spec,test}.*')],
  timeout: 100000,
};
