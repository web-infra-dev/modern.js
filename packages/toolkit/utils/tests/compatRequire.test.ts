import path from 'path';
import { cleanRequireCache, compatibleRequire } from '../src';

describe('compat require', () => {
  const fixturePath = path.resolve(__dirname, './fixtures/compat-require');

  test(`should support default property`, async () => {
    expect(await compatibleRequire(path.join(fixturePath, 'esm.js'))).toEqual({
      name: 'esm',
    });
  });

  test(`should support commonjs module`, async () => {
    expect(await compatibleRequire(path.join(fixturePath, 'cjs.js'))).toEqual({
      name: 'cjs',
    });
  });

  test(`should return null`, async () => {
    expect(await compatibleRequire(path.join(fixturePath, 'empty.js'))).toEqual(
      null,
    );
  });

  // The native Node.js require behavior does not support testing in the rstest
  test.skip('should clean cache after fn', () => {
    const foo = module.require('./fixtures/compat-require/foo');
    const requirePath = require.resolve('./fixtures/compat-require/foo.js');
    expect(foo.name).toBe('foo');
    expect(require.cache[requirePath]).toBeDefined();
    cleanRequireCache([requirePath]);
    rstest.resetModules();
    expect(require.cache[requirePath]).toBeUndefined();
  });
});
