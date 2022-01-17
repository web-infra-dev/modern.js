import generator from '../src';

describe('test-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
