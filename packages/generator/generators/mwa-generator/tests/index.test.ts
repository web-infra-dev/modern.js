import generator from '../src';

describe('mwa-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
