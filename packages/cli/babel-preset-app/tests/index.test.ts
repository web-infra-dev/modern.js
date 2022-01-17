import generateBabelChain from '../src';

describe('babel-preset-app', () => {
  it('default', () => {
    expect(generateBabelChain).toBeDefined();

    const cache = jest.fn();
    const webpackConfig = generateBabelChain({ cache });
    expect(Object.keys(webpackConfig)).toEqual(['presets', 'plugins']);
    expect(cache).toBeCalledWith(true);
  });
});
