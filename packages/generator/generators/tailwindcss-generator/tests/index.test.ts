import generator from '../src';

describe('tailwindcss-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
