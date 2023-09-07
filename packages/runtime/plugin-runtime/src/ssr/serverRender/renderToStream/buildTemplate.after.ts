import { serializeJson } from '@modern-js/utils/runtime-node';
import { RenderLevel, RuntimeContext } from '../types';
import { attributesToString } from '../utils';
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
      const { request, enableUnsafeCtx, nonce, tracker } = ssrContext!;
      const unsafeContext = {
        headers: request.headers,
      };
      const SSRData = {
        data: {
          initialData,
          i18nData: __i18nData__,
        },
        context: {
          reporter: {
            sessionId: tracker.sessionId,
          },
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
      const attrsStr = attributesToString({ nonce });

      return `
      <script${attrsStr}>window._SSR_DATA = ${serializeJson(SSRData)}</script>
      `;
    }
  }
}
