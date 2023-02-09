import type { StaticHandlerContext } from '@remix-run/router';
import serialize from 'serialize-javascript';
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
      const {
        ssrContext,
        renderLevel,
        routerContext: { loaderData },
      } = options;
      const { request, enableUnsafeCtx } = ssrContext;
      const unsafeContext = {
        headers: request.headers,
      };
      const SSRData = {
        routerData: {
          loaderData,
          // @TODO: add errors
        },
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
      <script>window._SSR_DATA = ${serialize(SSRData, {
        isJSON: true,
      })}</script>
      `;
    }
  }
}
