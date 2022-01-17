import generator from '../src';

describe('unbundle-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
