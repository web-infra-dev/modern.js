import { getUserAlias } from '../src';

describe('getUserAlias', () => {
  it('should filter invalid ts paths that are not array', () => {
    expect(
      getUserAlias({
        foo: ['a', 'b'],
        bar: 'c',
      }),
    ).toEqual({
      foo: ['a', 'b'],
    });
  });
});
