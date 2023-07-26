import { run } from '@modern-js/utils/runtime-node';
import { ServerRenderOptions } from '../types';
import { PreRender } from '../../react/prerender';
import { time } from '../time';
import SSREntry from './entry';

export const render = ({
  App,
  context,
  config,
}: ServerRenderOptions): Promise<string> => {
  const ssrContext = context.ssrContext!;

  return run(ssrContext.request.headers, async () => {
    const entry = new SSREntry({
      ctx: ssrContext,
      App,
      config,
    });
    entry.metrics.emitCounter('app.visit.count', 1);

    const end = time();
    const html = await entry.renderToHtml(context);
    const cost = end();

    entry.logger.info('App Render Total cost = %d ms', cost);
    entry.metrics.emitTimer('app.render.cost', cost);
    entry.reporter.reportTime('app_render_cost', cost);

    const cacheConfig = PreRender.config();
    if (cacheConfig) {
      context.ssrContext!.cacheConfig = cacheConfig;
    }

    return html;
  });
};
