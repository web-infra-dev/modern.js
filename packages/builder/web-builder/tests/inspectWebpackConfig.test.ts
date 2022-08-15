import webpack from 'webpack';
import { describe, expect, test } from 'vitest';
import { formatWebpackConfig } from '../src/core/inspectWebpackConfig';
import type { WebpackConfig } from '../src/types';

describe('inspectWebpackConfig', () => {
  test('should format webpack config correctly', async () => {
    const { DefinePlugin } = webpack;
    const webpackConfig: WebpackConfig = {
      mode: 'development',
      plugins: [new DefinePlugin({ foo: 'bar' })],
    };

    expect(await formatWebpackConfig(webpackConfig)).toMatchSnapshot();
  });
});
