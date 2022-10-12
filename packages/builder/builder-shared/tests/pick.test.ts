import { expect, describe, it } from 'vitest';
import { pick } from '../src';

describe('pick', () => {
  it('should pick from object correctly', () => {
    expect(pick({ foo: 1, bar: 2 }, ['foo'])).toEqual({ foo: 1 });
  });

  it('should not pick undefined properties', () => {
    expect(pick({ foo: undefined, bar: undefined }, ['foo'])).toEqual({});
  });
});
