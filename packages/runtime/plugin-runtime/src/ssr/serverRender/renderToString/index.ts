import { run } from '@modern-js/runtime-utils/node';
import { ServerRenderOptions } from '../types';
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

    const html = await entry.renderToHtml(context);

    return html;
  });
};
