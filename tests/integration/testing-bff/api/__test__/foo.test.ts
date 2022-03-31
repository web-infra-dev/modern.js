import foo from '../foo';

describe('test bff', () => {
  it('test function', async () => {
    const res = await foo();
    expect(res).toEqual({ method: 'get', url: 'foo' });
  });
});
