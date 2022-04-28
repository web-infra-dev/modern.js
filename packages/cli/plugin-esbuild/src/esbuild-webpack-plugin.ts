/**
 * refactor from https://github.com/sorrycc/esbuild-webpack-plugin/blob/master/src/index.ts
 * support webpack 5 and esbuild >= 0.12.22
 */
import { transform, TransformOptions, TransformResult } from 'esbuild';
import type { Compiler, Compilation } from 'webpack';

export type ESBuildPluginOptions = Omit<
  TransformOptions,
  'minify' | 'sourcemap' | 'sourcefile'
>;

export class ESBuildPlugin {
  private readonly options: ESBuildPluginOptions;

  constructor(options: ESBuildPluginOptions = {}) {
    this.options = options;
  }

  async transformCode({
    source,
    file,
    devtool,
  }: {
    source: string;
    file: string;
    devtool: string | boolean | undefined;
  }) {
    let result: TransformResult | undefined;
    let pluginOptions: ESBuildPluginOptions;
    if (/\.css(\?.*)?$/i.test(file)) {
      pluginOptions = { ...this.options, loader: 'css' };
    } else {
      pluginOptions = this.options;
    }

    const _transform = async (options: ESBuildPluginOptions) =>
      transform(source, {
        ...options,
        minify: true,
        sourcemap: Boolean(devtool),
        sourcefile: file,
      });

    try {
      result = await _transform(pluginOptions);
    } catch (e) {
      console.error(e);
    }

    return result;
  }

  apply(compiler: Compiler): void {
    const { devtool } = compiler.options;

    const plugin = 'ESBuild Plugin';
    compiler.hooks.compilation.tap(plugin, (compilation: Compilation) => {
      const { Compilation } = compiler.webpack;

      compilation.hooks.processAssets.tapPromise(
        {
          name: plugin,
          stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
        },
        async (assets: any) => {
          await this.updateAssets(compilation, Object.keys(assets), devtool);
        },
      );
    });
  }

  async updateAssets(
    compilation: Compilation,
    files: Array<string>,
    devtool: string | boolean | undefined,
  ): Promise<void> {
    for (const file of files) {
      if (!/\.(m?js|css)(\?.*)?$/i.test(file)) {
        continue;
      }

      const assetSource = compilation.assets[file];
      const { source, map } = assetSource.sourceAndMap();
      const result = await this.transformCode({
        source: source.toString(),
        file,
        devtool,
      });
      compilation.updateAsset(file, () => {
        const { SourceMapSource, RawSource } =
          compilation.compiler.webpack.sources;
        if (devtool) {
          return new SourceMapSource(
            result?.code || '',
            file,
            result?.map as any,
            source.toString(),
            map as any,
            true,
          ) as any;
        } else {
          return new RawSource(result?.code || '') as any;
        }
      });
    }
  }
}
