import { RuntimeContext } from 'src/runtime-context';
import serialize from 'serialize-javascript';
import { BuildTemplateCb, buildTemplate } from './buildTemplate.share';

type BuildShellAfterTemplateOptions = {
  context: RuntimeContext;
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
      const { ssrContext } = options.context;
      const { request } = ssrContext!;
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
      };
      return `
      <script>window._SSR_DATA = ${serialize(SSRData, {
        isJSON: true,
      })}</script>
      `;
    }
  }
}
