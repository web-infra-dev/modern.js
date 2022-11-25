import HtmlWebpackPlugin from 'html-webpack-plugin';
import fs from 'fs/promises';
import { getCompiledPath } from '../shared/fs';
import type { WebpackPluginInstance, Compiler } from 'webpack';
import type { AssetsRetryOptions } from '@modern-js/builder-shared';

export class AssetsRetryPlugin implements WebpackPluginInstance {
  readonly name: string;

  #retryOptions: AssetsRetryOptions;

  constructor(retryOptions: AssetsRetryOptions) {
    this.name = 'AssetsRetryPlugin';
    this.#retryOptions = retryOptions;
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(this.name, compilation => {
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapPromise(
        this.name,
        async data => {
          const { default: serialize } = await import(
            '../../compiled/serialize-javascript'
          );
          const runtimeFilePath = getCompiledPath('assets-retry.js');
          const runtimeCode = await fs.readFile(runtimeFilePath, 'utf-8');

          data.headTags.unshift({
            tagName: 'script',
            attributes: {
              type: 'text/javascript',
            },
            voidTag: false,
            // Runtime code will include `Object.defineProperty(exports,"__esModule",{value:!0})` after compiled by tsc
            // So we inject `var exports={}` to avoid `exports is not defined` error
            innerHTML: `var exports={};${runtimeCode}init(${serialize(
              this.#retryOptions,
            )})`,
            meta: {},
          });
          return data;
        },
      );
    });
  }
}
