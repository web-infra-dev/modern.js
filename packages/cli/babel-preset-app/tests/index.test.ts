import generateBabelChain from '../src';

describe('babel-preset-app', () => {
  it('default', () => {
    expect(generateBabelChain).toBeDefined();

    const cache = jest.fn();
    const webpackConfig = generateBabelChain(
      { cache },
      { appDirectory: process.cwd() },
    );
    expect(Object.keys(webpackConfig)).toEqual(['presets', 'plugins']);
    expect(webpackConfig.plugins).toContainEqual([
      require.resolve('../src/built-in/babel-plugin-lock-corejs-version'),
      expect.objectContaining({ metaName: 'modern-js' }),
    ]);
    expect(cache).toBeCalledWith(true);
  });

  it('no options', () => {
    expect(generateBabelChain).toBeDefined();

    const cache = jest.fn();
    const webpackConfig = generateBabelChain({ cache });
    expect(Object.keys(webpackConfig)).toEqual(['presets', 'plugins']);
    expect(cache).toBeCalledWith(true);
  });
});
