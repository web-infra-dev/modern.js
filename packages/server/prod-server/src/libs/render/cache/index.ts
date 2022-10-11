import { Transform, Writable } from 'stream';
import type { ModernServerContext } from '@modern-js/types';
import { RenderFunction, SSRServerContext } from '../type';
import { ERROR_DIGEST } from '../../../constants';
import { createCache } from './spr';
import { namespaceHash, withCoalescedInvoke } from './util';
import { CacheContext } from './type';

function useCacheStream() {
  let htmlForStream = '';
  const cacheStream = new Transform({
    write(chunk, _, callback) {
      htmlForStream += chunk.toString();
      this.push(chunk);
      callback();
    },
  });
  return {
    htmlForStream,
    cacheStream,
  };
}

export default (
  renderFn: RenderFunction<Writable>,
  ctx: ModernServerContext,
) => {
  const sprCache = createCache();

  const doRender = async (context: SSRServerContext) => {
    const { htmlForStream, cacheStream } = useCacheStream();

    const cacheContext: CacheContext = {
      entry: context.entryName,
      ...context.request,
    };
    const cacheFile = await sprCache.get(cacheContext);

    async function saveInCache(
      source: string | ((writable: Writable) => Promise<Writable>),
      onAllReadyRender: (html: string) => Promise<void>,
    ) {
      if (typeof source === 'string') {
        const html = source;
        await onAllReadyRender(html);
        return html;
      } else {
        const outputStream = await source(cacheStream);
        cacheStream.on('close', onAllReadyRender);
        return outputStream;
      }
    }

    // no cache, render sync
    if (!cacheFile) {
      const renderResult = await renderFn(context);
      return saveInCache(renderResult, async (html: string) => {
        const { cacheConfig } = context;
        if (html && cacheConfig) {
          await sprCache.set(cacheContext, htmlForStream, cacheConfig);
        }
      });
    }

    const cacheHash = cacheFile?.hash;

    // completely expired
    if (cacheFile.isGarbage) {
      const renderResult = await renderFn(context);
      return saveInCache(renderResult, async (html: string) => {
        const { cacheConfig } = context;
        if (html && cacheConfig) {
          await sprCache.set(cacheContext, htmlForStream, cacheConfig);
        }
      });
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
              saveInCache(res.value, (html: string) => {
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
