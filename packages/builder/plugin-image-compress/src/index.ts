import type { BuilderPlugin } from '@modern-js/builder-webpack-provider/types';
import { ModernJsImageMinimizerPlugin } from './minimizer';
import { withDefaultOptions } from './shared/utils';
import { Codecs, Options } from './types';

export type PluginImageCompressOptions = Options[];
export const DEFAULT_OPTIONS: Codecs[] = ['jpeg', 'png', 'ico'];

/** Options enable by default: {@link DEFAULT_OPTIONS} */
export const PluginImageCompress = (...options: Options[]): BuilderPlugin => ({
  name: 'builder-plugin-image-compress',
  setup(api) {
    const optsWithDefault = options.length ? options : DEFAULT_OPTIONS;
    const opts = optsWithDefault.map(opt => withDefaultOptions(opt));
    api.modifyWebpackChain((chain, { env }) => {
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
