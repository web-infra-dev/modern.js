import generator from '../src';

describe('eslint-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
