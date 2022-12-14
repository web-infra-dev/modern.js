import { Buffer } from 'buffer';
import { webpack } from '@modern-js/builder-webpack-provider/types';
import { FinalOptions } from './types';
import Codecs from './shared/codecs';

export const MODERN_JS_IMAGE_MINIMIZER_PLUGIN_NAME =
  '@modern-js/builder-plugin-image-compress/minimizer' as const;

export interface MinimizedResult {
  source: webpack.sources.RawSource;
}

export class ModernJsImageMinimizerPlugin {
  // eslint-disable-next-line @typescript-eslint/typedef
  name = MODERN_JS_IMAGE_MINIMIZER_PLUGIN_NAME;

  options: FinalOptions;

  constructor(options: FinalOptions) {
    this.options = options;
  }

  async optimize(
    compiler: webpack.Compiler,
    compilation: webpack.Compilation,
    assets: Record<string, webpack.sources.Source>,
  ): Promise<void> {
    const cache = compilation.getCache(MODERN_JS_IMAGE_MINIMIZER_PLUGIN_NAME);
    const { RawSource } = compiler.webpack.sources;
    const { matchObject } = compiler.webpack.ModuleFilenameHelpers;
    const buildError = (error: unknown, file?: string, context?: string) => {
      const cause = error instanceof Error ? error : new Error();
      const message =
        file && context
          ? `"${file}" in "${context}" from Modern.js Image Minimizer:\n${cause.message}`
          : cause.message;
      const ret = new compiler.webpack.WebpackError(message);
      error instanceof Error && ((ret as any).error = error);
      return ret;
    };

    const codec = Codecs[this.options.use];
    if (!codec) {
      compilation.errors.push(
        buildError(new Error(`Codec ${this.options.use} is not supported`)),
      );
    }
    const opts = { ...codec.defaultOptions, ...this.options };

    const handleAsset = async (name: string) => {
      const info = compilation.getAsset(name)?.info;

      // 1. Skip double minimize assets from child compilation
      // 2. Test file by options (e.g. test, include, exclude)
      if (info?.minimized || !matchObject(opts, name)) {
        return;
      }

      const { source: inputSource } = compilation.getAsset(name)!;

      const eTag = cache.getLazyHashedEtag(inputSource);
      const cacheItem = cache.getItemCache(name, eTag);
      let result = await cacheItem.getPromise<MinimizedResult | void>();

      try {
        if (!result) {
          const input = inputSource.source();
          const buf = await codec.handler(Buffer.from(input), opts);
          result = { source: new RawSource(buf) };
          await cacheItem.storePromise(result);
        }
        compilation.updateAsset(name, result.source, { minimized: true });
      } catch (error) {
        compilation.errors.push(buildError(error, name, compiler.context));
      }
    };
    const promises = Object.keys(assets).map(name => handleAsset(name));
    await Promise.all(promises);
  }
}
