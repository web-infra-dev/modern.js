import type { BuilderPlugin } from '@modern-js/builder-webpack-provider/types';
import assert from 'assert';
import { ModernJsImageMinimizerPlugin } from './minimizer';
import { withDefaultOptions } from './shared/utils';
import { Codecs, Options } from './types';

export type PluginImageCompressOptions = Options[];
export const DEFAULT_OPTIONS: Codecs[] = ['jpeg', 'png', 'ico'];

export interface IPluginImageCompress {
  (...options: Options[]): BuilderPlugin;
  (options: Options[]): BuilderPlugin;
}

const castOptions = (args: (Options | Options[])[]): Options[] => {
  const head = args[0];
  // expect [['png', { use: 'jpeg' }]]
  if (Array.isArray(head)) {
    return head;
  }
  // expect ['png', { use: 'jpeg' }]
  const ret: Options[] = [];
  for (const arg of args) {
    assert(!Array.isArray(arg));
    ret.push(arg);
  }
  return ret;
};

const normalizeOptions = (options: Options[]) => {
  const opts = options.length ? options : DEFAULT_OPTIONS;
  const normalized = opts.map(opt => withDefaultOptions(opt));
  return normalized;
};

/** Options enable by default: {@link DEFAULT_OPTIONS} */
export const builderPluginImageCompress: IPluginImageCompress = (
  ...args
): BuilderPlugin => ({
  name: 'builder-plugin-image-compress',
  setup(api) {
    const opts = normalizeOptions(castOptions(args));

    api.modifyBundlerChain((chain, { env }) => {
      if (env !== 'production') {
        return;
      }
      chain.optimization.minimize(true);
      for (const opt of opts) {
        chain.optimization
          .minimizer(`image-compress-${opt.use}`)
          .use(ModernJsImageMinimizerPlugin, [opt]);
      }
    });
  },
});

/**
 * @deprecated Using builderPluginImageCompress instead.
 */
export const PluginImageCompress = builderPluginImageCompress;
