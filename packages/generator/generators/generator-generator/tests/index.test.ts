import generator from '../src';

describe('generator-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
