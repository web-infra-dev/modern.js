describe('ts-paths-loader', () => {
  it('should ignore non-file parent urls', async () => {
    const loader = await import('../../src/esm/ts-paths-loader.mjs');

    await loader.initialize({
      appDir: '/project',
      baseUrl: '/project',
      paths: {
        '@/*': ['./src/*'],
      },
    });

    const defaultResolve = rstest.fn(value => ({ url: value }));
    const context = { parentURL: 'data:' };

    const result = loader.resolve('./postcss.config', context, defaultResolve);

    expect(defaultResolve).toBeCalledWith(
      './postcss.config',
      context,
      defaultResolve,
    );
    expect(result).toEqual({ url: './postcss.config' });
  });
});
