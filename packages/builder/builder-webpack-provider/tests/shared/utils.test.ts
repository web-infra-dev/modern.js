import webpack from 'webpack';
import { expect, describe, it } from 'vitest';
import { stringifyConfig, getHTMLPathByEntry } from '@/shared';
import type { BuilderConfig, NormalizedConfig, WebpackConfig } from '@/types';

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

describe('getHTMLPathByEntry', () => {
  it('should use distPath.html as the folder', async () => {
    const htmlPath = getHTMLPathByEntry('main', {
      output: {
        distPath: {
          html: 'my-html',
        },
      },
      html: {
        disableHtmlFolder: false,
      },
    } as NormalizedConfig);

    expect(htmlPath).toEqual('my-html/main/index.html');
  });

  it('should allow to disable html folder', async () => {
    const htmlPath = getHTMLPathByEntry('main', {
      output: {
        distPath: {
          html: 'html',
        },
      },
      html: {
        disableHtmlFolder: true,
      },
    } as NormalizedConfig);

    expect(htmlPath).toEqual('html/main.html');
  });
});
