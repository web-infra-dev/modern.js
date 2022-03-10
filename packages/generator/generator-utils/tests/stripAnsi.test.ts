import { stripAnsi } from '../src';

describe('test stripAnsi utils', () => {
  test('stripAnsi right', () => {
    expect(stripAnsi('v1.2.3')).toBe('v1.2.3');
  });
  test('stripAnsi error', () => {
    expect(() => stripAnsi(1 as any)).toThrow(TypeError);
  });
});
