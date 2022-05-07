import { createUnitTest } from './createUnitTest';

/**
 * globals package has identifiers like a-b-c, invalid variable name
 */
createUnitTest({
  pkgName: 'globals',
  pkgVersion: '11.12.0',
  specifier: 'globals',
});
