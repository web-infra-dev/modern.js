import { Readable, Writable, Transform } from 'stream';
import type { ModernServerContext } from '@modern-js/types';
import { RenderFunction, SSRServerContext } from '../type';
import { ERROR_DIGEST } from '../../../constants';
import { createCache } from './spr';
import { namespaceHash, withCoalescedInvoke } from './util';
import { CacheContext } from './type';

export default (renderFn: RenderFunction, ctx: ModernServerContext) => {
  const sprCache = createCache();

  const doRender = async (context: SSRServerContext) => {
    const cacheContext: CacheContext = {
      entry: context.entryName,
      ...context.request,
    };
    const cacheFile = await sprCache.get(cacheContext);

    async function afterRender(
      source: string | ((writable: Writable) => Promise<Readable>) | undefined,
      onAfterRender: (html: string) => Promise<void>,
    ) {
      // e.g. source is undefined when redirects occur during render
      if (!source) {
        return '';
      }
      if (typeof source === 'string') {
        await onAfterRender(source);
        return source;
      } else {
        let htmlForStream = '';
        const cacheStream = new Transform({
          write(chunk, _, callback) {
            htmlForStream += chunk.toString();
            this.push(chunk);
            callback();
          },
        });
        cacheStream.on('close', () => onAfterRender(htmlForStream));

        return source(cacheStream);
      }
    }

    async function saveHtmlIntoCache(html: string) {
      const { cacheConfig } = context;
      if (html && cacheConfig) {
        await sprCache.set(cacheContext, html, cacheConfig);
      }
    }

    // no cache, render sync
    if (!cacheFile) {
      const renderResult = await renderFn(context);
      return afterRender(renderResult, saveHtmlIntoCache);
    }

    const cacheHash = cacheFile?.hash;

    // completely expired
    if (cacheFile.isGarbage) {
      const renderResult = await renderFn(context);
      return afterRender(renderResult, saveHtmlIntoCache);
    } else if (cacheFile.isStale) {
      // if file is stale, request async
      const render = withCoalescedInvoke(() => renderFn(context)).bind(
        null,
        namespaceHash('render', cacheFile.hash),
        [],
      );

      render()
        .then(async res => {
          if (res.value && res.isOrigin) {
            const { cacheConfig } = context;
            if (cacheConfig) {
              afterRender(res.value, async (html: string) => {
                sprCache.set(cacheContext, html, cacheConfig);
              });
            } else {
              sprCache.del(cacheContext, cacheHash);
            }
          }
        })
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
