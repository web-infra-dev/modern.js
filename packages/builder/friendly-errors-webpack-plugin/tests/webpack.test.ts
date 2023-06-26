import fs from 'fs';
import path from 'path';
import { SpyInstance, describe, expect, test, vi } from 'vitest';
import webpack, { WebpackError } from 'webpack';
import TerminalRenderer from 'ansi-to-html';
import _ from '@modern-js/utils/lodash';
import webpackConfig from '../example/webpack.config';
import { FriendlyErrorsWebpackPlugin } from '@/plugin';
import { outputPrettyError } from '@/core/output';

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

const renderer = new TerminalRenderer();

const renderMockedLogs = (mocked: SpyInstance) => {
  const { calls } = mocked.mock;
  const logs = [];
  for (const args of calls) {
    logs.push(args.join(' '));
  }
  const rendered = renderer.toHtml(logs.join('\n'));
  const distDir = path.resolve(__dirname, `./dist`);
  try {
    fs.mkdirSync(distDir, { recursive: true });
  } catch {}
  fs.writeFileSync(
    path.resolve(distDir, `${Date.now()}.html`),
    `<body style="background-color: black"><pre>${rendered}</pre></body>`,
    'utf-8',
  );
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
  });

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
  });
});
