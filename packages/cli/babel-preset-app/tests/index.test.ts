import path from 'path';
import generateBabelChain from '../src';

describe('babel-preset-app', () => {
  it('default', () => {
    expect(generateBabelChain).toBeDefined();

    const cache = jest.fn();
    const babelOptions = generateBabelChain(
      { cache },
      { appDirectory: process.cwd() },
    );
    expect(Object.keys(babelOptions)).toEqual(['presets', 'plugins']);

    expect(babelOptions.plugins).toContainEqual([
      path.join(__dirname, '../src/built-in/babel-plugin-lock-corejs-version'),
      expect.objectContaining({ metaName: 'modern-js' }),
    ]);
    expect(cache).toBeCalledWith(true);
  });

  it('no options', () => {
    expect(generateBabelChain).toBeDefined();

    const cache = jest.fn();
    const babelOptions = generateBabelChain({ cache });
    expect(Object.keys(babelOptions)).toEqual(['presets', 'plugins']);
    expect(cache).toBeCalledWith(true);
  });

  it('with tools.babel config', () => {
    const toolsBabelConfig = (config: any) => {
      config.plugins = config.plugins.filter(() => false);
    };

    const cache = jest.fn();
    const babelOptions = generateBabelChain(
      { cache },
      { appDirectory: process.cwd(), userBabelConfig: toolsBabelConfig },
    );

    expect(babelOptions.plugins?.length).toEqual(0);
  });
});
