import { ModernServerContext } from '../../context';
import { RenderFunction, SSRServerContext } from '../type';
import { createCache } from './spr';
import { namespaceHash, withCoalescedInvoke } from './util';
import { CacheContext } from './type';
import { ERROR_DIGEST } from '../../../constants';

export default (renderFn: RenderFunction, ctx: ModernServerContext) => {
  const sprCache = createCache();

  const doRender: RenderFunction = async (context: SSRServerContext) => {
    const cacheContext: CacheContext = {
      entry: context.entryName,
      ...context.request,
    };

    const cacheFile = await sprCache.get(cacheContext);

    // no cache, render sync
    if (!cacheFile) {
      const html = await renderFn(context);
      const { cacheConfig } = context;

      if (html && cacheConfig) {
        await sprCache.set(cacheContext, html, cacheConfig);
      }

      return html;
    }

    const cacheHash = cacheFile?.hash;

    // completely expired
    if (cacheFile.isGarbage) {
      const html = await renderFn(context);
      const { cacheConfig } = context;

      if (html && cacheConfig) {
        await sprCache.set(cacheContext, html, cacheConfig);
      }

      return html;
    } else if (cacheFile.isStale) {
      // if file is stale, request async
      const render = withCoalescedInvoke(() => renderFn(context)).bind(
        null,
        namespaceHash('render', cacheFile.hash),
        [],
      );

      render()
        // eslint-disable-next-line promise/prefer-await-to-then
        .then(res => {
          if (res.value && res.isOrigin) {
            const { cacheConfig } = context;
            if (cacheConfig) {
              sprCache.set(cacheContext, res.value, cacheConfig);
            } else {
              sprCache.del(cacheContext, cacheHash);
            }
          }
        })
        // eslint-disable-next-line promise/prefer-await-to-then
        .catch(e => {
          sprCache.del(cacheContext, cacheHash);
          ctx.error(ERROR_DIGEST.ERENDER, e);
        });
    }

    ctx.res.setHeader('x-modern-spr', '1');
    return cacheFile.content as string;
  };

  return doRender;
};
