import generator from '../src';

describe('monorepo-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
