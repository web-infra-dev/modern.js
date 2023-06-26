jest.mock('@modern-js/runtime/koa', () => {
  return {
    __esModule: true,
    useContext: jest.fn(() => ({
      message: 'hello',
    })),
  };
});

describe('context', () => {
  it('should support mock useContext', async () => {
    const { post: postContext } = await import('../context');
    const data = await postContext();
    expect(data.message).toEqual('hello');
  });
});
