import webpack from 'webpack';
import { expect, describe, it } from 'vitest';
import { stringifyConfig } from '../../src/shared';
import type { BuilderConfig, WebpackConfig } from '../../src/types';

describe('stringifyConfig', () => {
  it('should stringify webpack config correctly', async () => {
    const { DefinePlugin } = webpack;
    const webpackConfig: WebpackConfig = {
      mode: 'development',
      plugins: [new DefinePlugin({ foo: 'bar' })],
    };

    expect(await stringifyConfig(webpackConfig)).toMatchSnapshot();
  });

  it('should stringify webpack config with verbose option correctly', async () => {
    const { DefinePlugin } = webpack;
    const webpackConfig: WebpackConfig = {
      mode: 'development',
      plugins: [
        new DefinePlugin({
          foo: 'bar',
          baz() {
            const a = 1;
            return a;
          },
        }),
      ],
    };

    expect(await stringifyConfig(webpackConfig, true)).toMatchSnapshot();
  });

  it('should stringify builder config correctly', async () => {
    const builderConfig: BuilderConfig = {
      tools: {
        webpackChain(chain) {
          chain.devtool('eval');
        },
      },
    };

    expect(await stringifyConfig(builderConfig)).toMatchSnapshot();
  });
});
