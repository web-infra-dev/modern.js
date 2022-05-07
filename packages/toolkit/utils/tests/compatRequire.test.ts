import path from 'path';
import { compatRequire, cleanRequireCache } from '../src/compatRequire';

describe('compat require', () => {
  const fixturePath = path.resolve(__dirname, './fixtures/compat-require');

  test(`should support default property`, () => {
    expect(compatRequire(path.join(fixturePath, 'esm.js'))).toEqual({
      name: 'esm',
    });
  });

  test(`should support commonjs module`, () => {
    expect(compatRequire(path.join(fixturePath, 'cjs.js'))).toEqual({
      name: 'cjs',
    });
  });

  test(`should return null`, () => {
    expect(compatRequire(path.join(fixturePath, 'empty.js'))).toEqual(null);
  });

  test('should clean cache after fn', () => {
    const foo = module.require('./fixtures/compat-require/foo');
    const requirePath = require.resolve('./fixtures/compat-require/foo.js');
    expect(foo.name).toBe('foo');
    expect(require.cache[requirePath]).toBeDefined();
    cleanRequireCache([requirePath]);
    jest.resetModules();
    expect(require.cache[requirePath]).toBeUndefined();
  });
});
