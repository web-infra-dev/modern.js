import { mapValue } from '../src/utils';

describe('mapValue', () => {
  it('should work when `args[0]` is object', () => {
    expect(mapValue({ a: 1, b: 2 }, x => x * x)).toEqual({ a: 1, b: 4 });
  });

  it('should work when `args[0]` is array', () => {
    expect(mapValue(['a', 'b', 'c'], x => x)).toEqual({
      '0': 'a',
      '1': 'b',
      '2': 'c',
    });
  });
});
