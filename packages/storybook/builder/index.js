/**
 * storybook uses import() to load this package.
 * and directly use the result.start, however
 * our exports are transpiled to something like
 *
 * ```
 * Object.defineProperty(exports, 'start', {
 *   get() { return ... }
 * })
 * ```
 *
 * we need to annotate the export, so it can be linked during compile time
 */
module.exports = require('./dist/cjs');

// eslint-disable-next-line no-constant-condition
if (false) {
  exports.start = null;
  exports.build = null;
  exports.bail = null;
  exports.getConfig = null;
  exports.corePresets = null;
  exports.defineConfig = null;
}
