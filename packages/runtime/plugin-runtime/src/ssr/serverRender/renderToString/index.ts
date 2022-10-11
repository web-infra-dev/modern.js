import { run } from '@modern-js/utils/ssr';
import { RuntimeContext, ModernSSRReactComponent } from '../types';
import { PreRender } from '../../react/prerender';
import { time } from '../utils';
import SSREntry from './entry';

export const render = (
  ctx: RuntimeContext,
  App: ModernSSRReactComponent,
): Promise<string> => {
  const { ssrContext } = ctx;

  return run(ssrContext!.request.headers, async () => {
    const entry = new SSREntry({
      ctx: ssrContext!,
      App,
    });
    entry.metrics.emitCounter('app.visit.count', 1);

    const end = time();
    const html = await entry.renderToHtml(ctx);
    const cost = end();

    entry.logger.info('App Render Total cost = %d ms', cost);
    entry.metrics.emitTimer('app.render.cost', cost);

    const cacheConfig = PreRender.config();
    if (cacheConfig) {
      ctx.ssrContext!.cacheConfig = cacheConfig;
    }

    return html;
  });
};
