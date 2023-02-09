import { expect, describe, it } from 'vitest';
import { formatRule, formatSplitChunks } from '@/core/formatConfig';

describe('formatConfig', () => {
  it('should throw error when rule item not support', async () => {
    expect(() => formatRule('...')).toThrowError(
      '... not supported in bundlerChain.rule',
    );

    expect(() =>
      formatRule({
        type: 'javascript/auto',
        test: /\.toml$/,
        scheme: 'data',
      }),
    ).toThrowError('scheme is not supported in bundlerChain.rule');

    expect(() =>
      formatRule({
        type: 'javascript/auto',
        test: /\.toml$/,
        exclude: () => true,
      }),
    ).toThrowError('exclude only support string or RegExp, but found function');
  });

  it('should convert bundler rule to rspack rule', async () => {
    expect(
      formatRule({
        type: 'javascript/auto',
        test: /\.toml$/,
        use: [
          {
            loader: 'toml-loader',
          },
        ],
      }),
    ).toEqual({
      type: 'javascript/auto',
      test: /\.toml$/,
      use: [
        {
          loader: 'toml-loader',
        },
      ],
    });

    expect(
      formatRule({
        type: 'javascript/auto',
        test: /\.toml$/,
        use: [
          {
            loader: 'builtin:toml-loader',
          },
        ],
      }),
    ).toEqual({
      type: 'javascript/auto',
      test: /\.toml$/,
      use: [
        {
          loader: 'builtin:toml-loader',
        },
      ],
    });
  });

  it('should throw error when splitChunks item not support', async () => {
    expect(() =>
      formatSplitChunks({
        chunks: 'all',
        cacheGroups: {
          vendors: false,
        },
      }),
    ).toThrowError('cacheGroups only support object');

    expect(() =>
      formatSplitChunks({
        chunks: 'all',
        maxSize: {
          aa: 1000,
        },
        cacheGroups: {
          vendors: {
            name: 'vendors',
            test: '/node_modules/',
          },
        },
      }),
    ).toThrowError(
      'maxSize only support number, but found object: {"aa":1000}',
    );
  });

  it('should convert bundler splitChunks to rspack splitChunks', async () => {
    expect(formatSplitChunks()).not.toBeDefined();
    expect(formatSplitChunks(false)).not.toBeDefined();

    expect(
      formatSplitChunks({
        chunks: 'all',
        cacheGroups: {
          vendors: {
            name: 'vendors',
            test: '/node_modules/',
            enforce: true,
          },
        },
      }),
    ).toEqual({
      chunks: 'all',
      cacheGroups: {
        vendors: {
          name: 'vendors',
          test: '/node_modules/',
          enforce: true,
        },
      },
    });
  });
});
