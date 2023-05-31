describe('context', () => {
  it('should support context', async () => {
    const { get: getContext } = await import('../context');
    const data = await getContext();
    expect(data).toEqual({
      message: 'Hello Modern.js',
    });
  });
});
