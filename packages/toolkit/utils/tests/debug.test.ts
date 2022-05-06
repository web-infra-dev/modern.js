import { debug } from '../src/compiled';
import { stripAnsi } from '../src';
import { createDebugger } from '../src/debug';

describe('debug utility', () => {
  test('should return file path', () => {
    const debug1 = createDebugger('test');

    const debug2 = createDebugger('test2');

    debug.enable('modern-js:test2');

    debug.log = (...args) => {
      // XXX: args[0] 的内容有时候是 '  \x1B[38;5;167;1mmodern-js:test2 \x1B[0m22222' 这种格式
      expect(stripAnsi(args[0])).toContain('modern-js:test2 22222');
    };

    debug1('11111');
    debug2('22222');

    expect(debug2.enabled).toBe(true);

    expect(debug1.enabled).toBe(false);
  });
});
