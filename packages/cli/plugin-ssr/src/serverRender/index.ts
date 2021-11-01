import { RuntimeContext } from '@modern-js/runtime-core';
import { PreRender } from '../react/prerender';
import { run } from '../hook';
import SSREntry from './entry';
import { ModernSSRReactComponent } from './type';

declare module '@modern-js/runtime' {
  interface RuntimeContext {
    ssrContext?: any;
  }
}

export const render = async (
  ctx: RuntimeContext,
  _: string = process.cwd(),
  App: ModernSSRReactComponent,
): Promise<string> => {
  const { entryName, template: templateHTML } = ctx.ssrContext;
  // const templateHTML = path.join(pwd, entryPath);

  return run(ctx.ssrContext.request.headers, async () => {
    const entry = new SSREntry({
      name: entryName,
      App,
      template: templateHTML,
    });

    const html = await entry.renderToHtml(ctx);
    const cacheConfig = PreRender.config();
    if (cacheConfig) {
      // eslint-disable-next-line require-atomic-updates
      ctx.ssrContext.cacheConfig = cacheConfig;
    }

    return html;
  });
};
