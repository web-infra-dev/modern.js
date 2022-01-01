import debug from 'debug';
import { createDebugger } from '../src/debug';

describe('debug utility', () => {
  test('should return file path', () => {
    const debug1 = createDebugger('test');

    const debug2 = createDebugger('test2');

    debug.enable('modern-js:test2');

    debug.log = (...args) => {
      expect(args[0]).toContain('modern-js:test2 22222');
    };

    debug1('11111');
    debug2('22222');

    expect(debug2.enabled).toBe(true);

    expect(debug1.enabled).toBe(false);
  });
});
