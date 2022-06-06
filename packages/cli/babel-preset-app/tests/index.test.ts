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
      require.resolve('../src/built-in/babel-plugin-lock-corejs-version'),
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
      config.plugins = config.plugins.filter((item: any) => {
        const name = typeof item === 'string' ? item : item[0];
        return !name.includes(
          `@babel${path.sep}plugin-transform-destructuring`,
        );
      });
    };

    const cache = jest.fn();
    const babelOptions = generateBabelChain(
      { cache },
      { appDirectory: process.cwd(), userBabelConfig: toolsBabelConfig },
    );

    expect(babelOptions.plugins).toEqual(
      expect.not.arrayContaining([
        [require.resolve('@babel/plugin-transform-destructuring')],
      ]),
    );
  });
});
