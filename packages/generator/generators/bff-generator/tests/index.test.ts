import generator from '../src';

describe('bff-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
