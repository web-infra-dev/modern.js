import { fs } from '@modern-js/utils';
// @ts-expect-error
import { RawSource } from 'webpack-sources';
import { getSharedPkgCompiledPath } from '../utils';
import {
  generateScriptTag,
  getBuilderVersion,
  getPublicPathFromCompiler,
  COMPILATION_PROCESS_STAGE,
} from './util';
import type HtmlWebpackPlugin from 'html-webpack-plugin';
import type { WebpackPluginInstance, Compiler, Compilation } from 'webpack';
import type { AssetsRetryOptions } from '../types';
import path from 'path';
import { withPublicPath } from '../url';

export class AssetsRetryPlugin implements WebpackPluginInstance {
  readonly name: string;

  readonly distDir: string;

  readonly inlineScript: boolean;

  readonly HtmlPlugin: typeof HtmlWebpackPlugin;

  scriptPath: string;

  readonly #retryOptions: AssetsRetryOptions;

  constructor(
    options: AssetsRetryOptions & {
      distDir: string;
      HtmlPlugin: typeof HtmlWebpackPlugin;
    },
  ) {
    const {
      distDir,
      HtmlPlugin,
      inlineScript = true,
      ...retryOptions
    } = options;
    this.name = 'AssetsRetryPlugin';
    this.#retryOptions = retryOptions;
    this.distDir = distDir;
    this.HtmlPlugin = HtmlPlugin;
    this.inlineScript = inlineScript;
    this.scriptPath = '';
  }

  async getRetryCode() {
    const { default: serialize } = await import(
      '../../compiled/serialize-javascript'
    );
    const runtimeFilePath = getSharedPkgCompiledPath('assetsRetry.js');
    const runtimeCode = await fs.readFile(runtimeFilePath, 'utf-8');
    return `(function(){${runtimeCode};init(${serialize(
      this.#retryOptions,
    )});})()`;
  }

  async getScriptPath() {
    if (!this.scriptPath) {
      const version = await getBuilderVersion();
      this.scriptPath = path.join(this.distDir, `assets-retry.${version}.js`);
    }
    return this.scriptPath;
  }

  apply(compiler: Compiler): void {
    if (!this.inlineScript) {
      compiler.hooks.thisCompilation.tap(
        this.name,
        (compilation: Compilation) => {
          compilation.hooks.processAssets.tapPromise(
            {
              name: this.name,
              stage: COMPILATION_PROCESS_STAGE.PROCESS_ASSETS_STAGE_PRE_PROCESS,
            },
            async assets => {
              const scriptPath = await this.getScriptPath();
              assets[scriptPath] = new RawSource(
                await this.getRetryCode(),
                false,
              );
            },
          );
        },
      );
    }

    compiler.hooks.compilation.tap(this.name, compilation => {
      // the behavior of inject/modify tags in afterTemplateExecution hook will not take effect when inject option is false
      this.HtmlPlugin.getHooks(compilation).alterAssetTagGroups.tapPromise(
        this.name,
        async data => {
          const scriptTag = generateScriptTag();

          if (this.inlineScript) {
            data.headTags.unshift({
              ...scriptTag,
              innerHTML: await this.getRetryCode(),
            });
          } else {
            const publicPath = getPublicPathFromCompiler(compiler);
            const url = withPublicPath(await this.getScriptPath(), publicPath);
            data.headTags.unshift({
              ...scriptTag,
              attributes: {
                ...scriptTag.attributes,
                src: url,
              },
            });
          }

          return data;
        },
      );
    });
  }
}
