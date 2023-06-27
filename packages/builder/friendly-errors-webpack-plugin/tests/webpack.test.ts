import path from 'path';
import { SpyInstance, describe, expect, test, vi } from 'vitest';
import webpack, { WebpackError } from 'webpack';
import TerminalRenderer from 'ansi-to-html';
import _ from '@modern-js/utils/lodash';
import fs from '@modern-js/utils/fs-extra';
import webpackConfig from '../example/webpack.config';
import { FriendlyErrorsWebpackPlugin } from '@/plugin';
import { outputPrettyError } from '@/core/output';

const themes = {
  oneDark: {
    fg: '#abb2bf',
    bg: '#282c34',
    colors: [
      '#282c34',
      '#e06c75',
      '#98c379',
      '#e5c07b',
      '#61afef',
      '#c678dd',
      '#56b6c2',
      '#abb2bf',
      '#5c6370',
      '#be5046',
      '#98c379',
      '#d19a66',
      '#61afef',
      '#c678dd',
      '#56b6c2',
      '#ffffff',
    ],
  },
  oneLight: {
    fg: '#383a42',
    bg: '#fafafa',
    colors: [
      '#fafafa',
      '#e06c75',
      '#98c379',
      '#d19a66',
      '#61afef',
      '#c678dd',
      '#56b6c2',
      '#abb2bf',
      '#383a42',
      '#e06c75',
      '#50a14f',
      '#d19a66',
      '#61afef',
      '#c678dd',
      '#56b6c2',
      '#ffffff',
    ],
  },
} satisfies Record<string, ConstructorParameters<typeof TerminalRenderer>[0]>;

export const webpackBuild = async (compiler: webpack.Compiler) => {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(closeErr => {
        console.error(closeErr);
        if (err || !stats || stats.hasErrors()) {
          const buildError: Error & { stats?: webpack.Stats } =
            err || new Error('Webpack build failed!');
          buildError.stats = stats;
          reject(buildError);
        } else {
          resolve({ stats });
        }
      });
    });
  });
};

const renderMockedLogs = (mocked: SpyInstance) => {
  const { calls } = mocked.mock;
  const logs = [];
  for (const args of calls) {
    logs.push(args.join(' '));
  }
  let rendered = '';
  const scope = Date.now();
  for (const [name, opts] of Object.entries(themes)) {
    const renderer = new TerminalRenderer(opts);
    rendered = renderer.toHtml(logs.join('\n'));
    fs.outputFile(
      path.resolve(__dirname, `./dist/${scope}/${name}.html`),
      `<body style="background-color: ${opts.bg}"><pre>${rendered}</pre></body>`,
    );
  }
  return rendered;
};

describe('webpack', () => {
  test('compilation.errors', async () => {
    const mockedError = vi.spyOn(console, 'error').mockImplementation(_.noop);
    const config: webpack.Configuration = {
      ...webpackConfig,
      plugins: [new FriendlyErrorsWebpackPlugin()],
    };
    const compiler = webpack(config);
    compiler.hooks.compilation.tap('dev', compilation => {
      compilation.errors.push(new WebpackError('foo'));
    });
    await expect(webpackBuild(compiler)).rejects.toThrow();
    expect(renderMockedLogs(mockedError)).toMatchSnapshot();
  }, 30_000);

  test('throw new error', async () => {
    const mockedError = vi.spyOn(console, 'error').mockImplementation(_.noop);
    const config: webpack.Configuration = {
      ...webpackConfig,
    };
    const compiler = webpack(config);
    compiler.hooks.compilation.tap('dev', () => {
      throw new Error('bar');
    });
    await webpackBuild(compiler).catch(e => outputPrettyError(e));
    expect(renderMockedLogs(mockedError)).toMatchSnapshot();
  }, 30_000);
});
