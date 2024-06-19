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
      ctx: ssrContext as any,
      App,
      config,
    });

    const html = await entry.renderToHtml(context);

    return html;
  });
};
