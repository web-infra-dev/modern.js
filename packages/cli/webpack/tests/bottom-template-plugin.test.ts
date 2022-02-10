/**
 * @jest-environment node
 */
import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { BottomTemplatePlugin } from '../src/plugins/bottom-template-plugin';

const bottomTemplateReg = /<!--<\?-\s*bottomTemplate\s*\?>-->/;

describe('bottom-template-plugin', () => {
  it('basic usage', async () => {
    const webpackConfig = {
      mode: 'production',
      entry: path.join(__dirname, 'fixtures/index.js'),
      output: {
        path: path.join(__dirname, 'fixtures/dist'),
        filename: 'index_bundle.js',
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: path.join(__dirname, 'fixtures/templateParam.html'),
          inject: false,
          minify: false, // otherwise, special comments in templates would be removed
          bottomTemplate: 'this is bottom',
          __internal__: true,
        }),
        new BottomTemplatePlugin(HtmlWebpackPlugin),
      ],
    };

    await new Promise<void>(resolve => {
      webpack(webpackConfig as any, (err, _) => {
        expect(err).toBeFalsy();

        const htmlExists = fs.existsSync(
          path.join(__dirname, 'fixtures/dist/index.html'),
        );
        expect(htmlExists).toBe(true);

        const html = fs
          .readFileSync(path.join(__dirname, 'fixtures/dist/index.html'))
          .toString();
        expect(html).toMatch('this is bottom');
        expect(html).not.toMatch(bottomTemplateReg);

        resolve();
      });
    });
  });

  it('HtmlWebpackPlugin from outside', async () => {
    const webpackConfig = {
      mode: 'production',
      entry: path.join(__dirname, 'fixtures/index.js'),
      output: {
        path: path.join(__dirname, 'fixtures/dist'),
        filename: 'index_bundle.js',
      },
      plugins: [
        new HtmlWebpackPlugin({
          template: path.join(__dirname, 'fixtures/templateParam.html'),
          inject: false,
          minify: false, // otherwise, special comments in templates would be removed
          bottomTemplate: 'this is bottom',
        }),
        new BottomTemplatePlugin(HtmlWebpackPlugin),
      ],
    };

    await new Promise<void>(resolve => {
      webpack(webpackConfig as any, (err, _) => {
        expect(err).toBeFalsy();

        const htmlExists = fs.existsSync(
          path.join(__dirname, 'fixtures/dist/index.html'),
        );
        expect(htmlExists).toBe(true);

        const html = fs
          .readFileSync(path.join(__dirname, 'fixtures/dist/index.html'))
          .toString();
        expect(html).toMatch(bottomTemplateReg);
        expect(html).not.toMatch('this is bottom');

        resolve();
      });
    });
  });
});
