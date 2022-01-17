import generator from '../src';

describe('ssg-generator', () => {
  it('default', () => {
    expect(generator).toBeInstanceOf(Function);
  });
});
