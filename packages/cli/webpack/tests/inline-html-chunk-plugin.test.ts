/**
 * @jest-environment node
 */
import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { InlineChunkHtmlPlugin } from '../src/plugins/inline-html-chunk-plugin';

const appDir = path.join(__dirname, 'fixtures/inline-chunk-template');

describe('inline-chunk-template', () => {
  it('basic usage', async () => {
    const webpackConfig = {
      mode: 'production',
      entry: path.join(appDir, 'index.js'),
      output: {
        path: path.join(appDir, 'dist'),
        filename: 'index_bundle.js',
      },
      plugins: [
        new HtmlWebpackPlugin({
          minify: false,
          __internal__: true,
        }),
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/index_bundle/]),
      ],
    };

    await new Promise<void>(resolve => {
      webpack(webpackConfig as any, (err, _) => {
        expect(err).toBeFalsy();

        const htmlExists = fs.existsSync(path.join(appDir, 'dist/index.html'));
        expect(htmlExists).toBe(true);

        const html = fs
          .readFileSync(path.join(appDir, 'dist/index.html'))
          .toString();

        expect(html).not.toMatch('defer');
        expect(html).not.toMatch('index_bundle');
        expect(html).toMatch('<script>console.log("test");</script></body>');

        resolve();
      });
    });
  });
});
