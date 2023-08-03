import { expect } from 'chai';
import { mapValue } from '../src';

describe('mapValue', () => {
  it('should work when `args[0]` is object', () => {
    expect(mapValue({ a: 1, b: 2 }, (x) => x * x)).deep.equal({ a: 1, b: 4 });
  });

  it('should work when `args[0]` is array', () => {
    expect(mapValue(['a', 'b', 'c'], (x) => x)).deep.equal({
      '0': 'a',
      '1': 'b',
      '2': 'c',
    });
  });

  it('should crash when `args[0]` is other type', () => {
    expect(() => {
      // @ts-ignore
      mapValue(1, (x) => x);
    }).throw(Error);
  });
});
