import type { StaticHandlerContext } from '@modern-js/utils/remix-router';
import { serializeJson } from '@modern-js/utils/serialize';
import { RenderLevel, SSRServerContext } from '../types';
import { BuildTemplateCb, buildTemplate } from './buildTemplate.share';

type BuildShellAfterTemplateOptions = {
  ssrContext: SSRServerContext;
  routerContext: StaticHandlerContext;
  renderLevel: RenderLevel;
};
export function buildShellAfterTemplate(
  afterAppTemplate: string,
  options: BuildShellAfterTemplateOptions,
) {
  const callbacks: BuildTemplateCb[] = [injectSSRDataScript];
  return buildTemplate(afterAppTemplate, callbacks);

  function injectSSRDataScript(template: string) {
    const ssrDataScript = buildSSRDataScript();
    return template.replace('<!--<?- SSRDataScript ?>-->', ssrDataScript);

    function buildSSRDataScript() {
      const { ssrContext, renderLevel } = options;
      const { request, enableUnsafeCtx } = ssrContext;
      const unsafeContext = {
        headers: request.headers,
      };
      const SSRData = {
        context: {
          request: {
            params: request.params,
            query: request.query,
            pathname: request.pathname,
            host: request.host,
            url: request.url,
            ...(enableUnsafeCtx ? unsafeContext : {}),
          },
        },
        renderLevel,
      };
      return `
      <script>window._SSR_DATA = ${serializeJson(SSRData)}</script>
      `;
    }
  }
}
