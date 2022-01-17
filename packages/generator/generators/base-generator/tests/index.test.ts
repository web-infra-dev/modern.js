import generator from '../src';

describe('base-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
