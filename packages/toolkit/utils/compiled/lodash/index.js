/**
 * We just prebundled the `@types/lodash`
 * The `lodash` is not prebundled because lots of packages will depend on it.
 */
module.exports = require('lodash');
