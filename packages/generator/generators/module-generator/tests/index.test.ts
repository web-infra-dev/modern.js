import generator from '../src';

describe('module-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
