import { LogLevel as esbuildLogLevel, BuildResult, BuildOptions, BuildContext, context, build } from 'esbuild';
import chalk from 'chalk';
import { getLogLevel } from '../logger';
import { LibuildError } from '../error';
import { Callback, ILibuilder, BuildConfig, IBuilderBase, EsbuildResultInfo, EsbuildError } from '../types';
import { adapterPlugin } from './adapter';
import { jsExtensions } from '../core/resolve';
import { ErrorCode } from '../constants/error';
import type { Format } from '../types/config';
import { swcTransformPluginName, es5PluginName, umdPluginName } from '../constants/plugins';

function convertLogLevel(level: BuildConfig['logLevel']): esbuildLogLevel {
  if (getLogLevel(level) < getLogLevel('debug')) {
    return 'silent';
  }
  return level;
}

function getEsbuildTarget(options: {
  enableSwcTransform: boolean;
  haveUmdPlugin: boolean;
  haveEs5Plugin: boolean;
  target: string;
  format: Format;
}) {
  const { enableSwcTransform, haveUmdPlugin, haveEs5Plugin, target, format } = options;
  if (format === 'umd' && haveUmdPlugin) {
    // umd-plugin will transform syntax by user-target.
    return undefined;
  }

  if (enableSwcTransform) {
    // swc-transform will transform syntax by user-target
    // when esbuild target is undefined. esbuild will transform nothing about syntax.

    // but es5 is special, must be set to 'es5'.
    // eg: when esbuild target is not 'es5'. swc-transform result is {value: value}, esbuild will transform it to {value}
    if (target === 'es5') {
      return 'es5';
    }

    return undefined;
  }

  // default case, use esbuild-transform target or es5-plugin.
  return haveEs5Plugin ? 'esnext' : target;
}

function getEsbuildFormat(options: {
  enableSwcTransform: boolean;
  bundle: boolean;
  format?: Format;
  splitting: boolean;
}) {
  const { enableSwcTransform, format, bundle, splitting } = options;

  // cjs splitting
  // with ./plugins/format-cjs
  if (bundle && splitting && format === 'cjs') {
    return 'esm';
  }

  if (format === 'esm' || format === 'cjs') {
    // swc transform and bundleless build
    if (enableSwcTransform && !bundle) {
      return undefined;
    }

    // case1: default transform
    // case2: swc transform and bundle build
    return format;
  }

  // when format is umd, disable swc-transform and use umd-plugin,
  // so esbuild format should be `esm`.
  if (format === 'umd') {
    // https://esbuild.github.io/api/#format
    // When no output format is specified, esbuild picks an output format for you if bundling is enabled (as described below),
    // or **doesn't do any format conversion if bundling is disabled**.
    return bundle ? 'esm' : undefined;
  }

  // when format is iife, swc-transform only transform syntax, esbuild transform js format.
  if (format === 'iife') {
    return 'iife';
  }

  // fallback
  return format;
}

export class EsbuildBuilder implements IBuilderBase {
  compiler: ILibuilder;

  instance?: BuildContext;

  result?: BuildResult;

  reBuildCount: number;

  constructor(compiler: ILibuilder) {
    this.compiler = compiler;
    this.reBuildCount = 0;
  }

  close(callback?: Callback) {
    try {
      this.instance?.cancel();
      this.instance?.dispose();
      callback?.();
      /* c8 ignore next */
    } catch (err) {
      /* c8 ignore next */
      callback?.(err);
    }
  }

  private async report(error: EsbuildResultInfo) {
    const { compiler } = this;
    compiler.report(this.parseError(error));
    await compiler.hooks.endCompilation.promise(compiler.getErrors());
  }

  private parseError(err: EsbuildResultInfo) {
    const infos: LibuildError[] = [];
    const parseDetail = (item: EsbuildError) => {
      if (item.detail) {
        return this.parseError(item.detail);
      }
    };

    if (err.errors) {
      infos.push(
        ...err.errors
          .map((item: EsbuildError) => {
            return (
              parseDetail(item) ??
              LibuildError.from(item, {
                level: 'Error',
                code: ErrorCode.ESBUILD_ERROR,
              })
            );
          })
          .reduce((acc: any[], val: any) => acc.concat(val), [])
      );
    }

    if (err.warnings) {
      infos.push(
        ...err.warnings
          .map((item: EsbuildError) => {
            return (
              parseDetail(item) ??
              LibuildError.from(item, {
                level: 'Warn',
                code: ErrorCode.ESBUILD_WARN,
              })
            );
          })
          .reduce((acc: any[], val: any) => acc.concat(val), [])
      );
    }

    if (infos.length === 0) {
      infos.push(LibuildError.from(err));
    }

    return infos;
  }

  async build() {
    // /**
    //  * it's pity that esbuild doesn't supports inline tsconfig
    //  * fix me later after  https://github.com/evanw/esbuild/issues/943 resolved
    //  */
    // const tsConfigPath = path.resolve(__dirname, '../config/tsconfig.json');
    // if (!fs.existsSync(tsConfigPath)) {
    //   throw new Error(`failed to load tsconfig at  ${tsConfigPath}`);
    // }

    const { compiler } = this;
    const {
      input,
      bundle,
      define,
      target,
      sourceMap,
      resolve,
      watch,
      platform,
      logLevel,
      inject,
      root,
      splitting,
      outdir,
      outbase,
      entryNames,
      minify,
      chunkNames,
      jsx,
      esbuildOptions,
      format,
      asset,
    } = compiler.config;

    // if have libuild:swc-transform, so enable swc-transform
    const enableSwcTransform = !!compiler.plugins.find((plugin) => plugin.name === swcTransformPluginName);
    const haveUmdPlugin = !!compiler.plugins.find((plugin) => plugin.name === umdPluginName);
    const haveEs5Plugin = !!compiler.plugins.find((plugin) => plugin.name === es5PluginName);

    const esbuildFormat = getEsbuildFormat({ enableSwcTransform, bundle, format, splitting });
    const esbuildTarget = getEsbuildTarget({
      enableSwcTransform,
      haveUmdPlugin,
      haveEs5Plugin,
      format,
      target,
    });

    const esbuildConfig: BuildOptions = {
      entryPoints: input,
      metafile: true,
      define,
      bundle,
      format: esbuildFormat,
      target: esbuildTarget,
      sourcemap: sourceMap ? 'external' : false,
      mainFields: resolve.mainFields,
      resolveExtensions: jsExtensions,
      splitting,
      charset: 'utf8',
      logLimit: 5,
      absWorkingDir: root,
      platform,
      write: false,
      logLevel: convertLogLevel(logLevel),
      outdir,
      outbase,
      entryNames,
      chunkNames,
      plugins: [adapterPlugin(this.compiler)],
      minifyIdentifiers: !!minify,
      minify: minify === 'esbuild',
      inject,
      jsx,
      supported: {
        'dynamic-import': bundle || format !== 'cjs',
      },
      assetNames: `${asset.outdir}/[name].[hash]`,
    };

    const buildOptions = esbuildOptions(esbuildConfig);
    try {
      if (watch) {
        this.instance = await context(buildOptions);
        this.result = await this.instance.rebuild();
      } else {
        this.result = await build(buildOptions);
      }
      if (this.result.warnings.length) {
        this.report(this.result);
      }
    } catch (error: any) {
      await this.report(error);

      if (watch) {
        this.instance?.cancel();
      }
    }
  }

  async reBuild(type: 'link' | 'change') {
    const { instance, compiler } = this;
    try {
      const start = Date.now();
      if (type === 'link') {
        await this.build();
      } else {
        this.result = await instance?.rebuild();
      }
      compiler.config.logger.info(
        chalk.green`Rebuild Successfully in ${Date.now() - start}ms`,
        chalk.yellow`Rebuild Count: ${++this.reBuildCount}`
      );
    } catch (error: any) {
      this.report(error);
      compiler.printErrors();
    }
  }
}
