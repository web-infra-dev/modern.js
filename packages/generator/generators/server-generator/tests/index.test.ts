import generator from '../src';

describe('server-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
