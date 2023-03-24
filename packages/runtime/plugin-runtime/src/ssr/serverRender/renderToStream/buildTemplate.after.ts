import { serializeJson } from '@modern-js/utils/universal/serialize';
import { RenderLevel, RuntimeContext } from '../types';
import { BuildTemplateCb, buildTemplate } from './buildTemplate.share';

type BuildShellAfterTemplateOptions = {
  context: RuntimeContext;
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
        context: { ssrContext, initialData, __i18nData__ },
        renderLevel,
      } = options;
      const { request, enableUnsafeCtx } = ssrContext!;
      const unsafeContext = {
        headers: request.headers,
      };
      const SSRData = {
        data: {
          initialData,
          i18nData: __i18nData__,
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
      <script>window._SSR_DATA = ${serializeJson(SSRData)}</script>
      `;
    }
  }
}
