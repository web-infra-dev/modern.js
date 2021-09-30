import { createUnitTest } from './createUnitTest';

/**
 * js-tokens@6.0.0 has exports setup in package.json
 *
 * we can not resolve('js-tokens/package.json'),
 * thus the logic is changed to find up from specifier path
 */

createUnitTest({
  pkgName: 'js-tokens',
  pkgVersion: '6.0.0',
  specifier: 'js-tokens',
});
