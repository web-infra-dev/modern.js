import serialize from 'serialize-javascript';
import { RenderLevel, SSRServerContext } from '../types';
import { BuildTemplateCb, buildTemplate } from './buildTemplate.share';

type BuildShellAfterTemplateOptions = {
  ssrContext: SSRServerContext;
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
      const { request } = ssrContext;
      const SSRData = {
        context: {
          request: {
            params: request.params,
            query: request.query,
            pathname: request.pathname,
            host: request.host,
            url: request.url,
            headers: request.headers,
            cookieMap: request.cookieMap,
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
