/* eslint-disable node/no-unsupported-features/es-syntax */
const b = require('./b');

module.exports = {
  ...b,
  a: 'a',
};
/* eslint-enable node/no-unsupported-features/es-syntax */
