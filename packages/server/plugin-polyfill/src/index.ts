import type { ServerPlugin } from '@modern-js/server-core';
import { NextFunction, ModernServerContext } from '@modern-js/types/server';
import type { NormalizedConfig } from '@modern-js/core';
import { getPolyfillString } from '@modern-js/polyfill-lib';
import { mime } from '@modern-js/utils';
import Parser from 'ua-parser-js';
import { defaultFeatures, defaultPolyfill } from './const';
import PolyfillCache, { generateCacheKey } from './libs/cache';

export default (): ServerPlugin => ({
  name: '@modern-js/plugin-polyfill',

  setup: () => ({
    beforeProdServer(_: NormalizedConfig) {
      const cache = new PolyfillCache();
      const route = defaultPolyfill;
      const features = defaultFeatures;
      const minify = process.env.NODE_ENV === 'production';

      const featureDig = Object.keys(features)
        .map(name => {
          const { flags = ['gated'] } = features[name];
          const flagStr = flags.join(',');

          return `${name}-${flagStr}`;
        })
        .join(',');

      return async (context: ModernServerContext, next: NextFunction) => {
        if (context.url !== route) {
          return next();
        }

        const parsedUA = Parser(context.headers['user-agent']);
        const { name = '', version = '' } = parsedUA.browser;

        const cacheKey = generateCacheKey({
          name,
          version,
          features: featureDig,
          minify,
        });
        const matched = cache.get(cacheKey);
        if (matched) {
          context.res.setHeader(
            'content-type',
            mime.contentType('js') as string,
          );
          return context.res.end(matched);
        }

        const polyfill = await getPolyfillString({
          uaString: context.headers['user-agent'] as string,
          minify,
          features,
        });

        cache.set(cacheKey, polyfill);

        context.res.setHeader('content-type', mime.contentType('js') as string);
        return context.res.end(polyfill);
      };
    },
  }),
});
