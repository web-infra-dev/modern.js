import generator from '../src';

describe('entry-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
