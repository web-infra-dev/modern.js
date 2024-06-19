import { serializeJson } from '@modern-js/runtime-utils/node';
import { parseQuery } from '@modern-js/runtime-utils/universal';
import { attributesToString, safeReplace } from '../utils';
import { SSR_DATA_PLACEHOLDER } from '../constants';
import { BuildHtmlCb, buildHtml, RenderLevel } from '../shared';
import { HandleRequestConfig } from '../requestHandler';
import { RuntimeContext } from '../../context';

export type BuildShellAfterTemplateOptions = {
  runtimeContext: RuntimeContext;
  renderLevel: RenderLevel;
  request: Request;
  config: HandleRequestConfig;
};

export function buildShellAfterTemplate(
  afterAppTemplate: string,
  options: BuildShellAfterTemplateOptions,
) {
  const { request, config, runtimeContext, renderLevel } = options;

  const callbacks: BuildHtmlCb[] = [
    createReplaceSSRData({
      request,
      nonce: config.nonce,
      runtimeContext,
      renderLevel,
    }),
  ];
  return buildHtml(afterAppTemplate, callbacks);
}

function createReplaceSSRData(options: {
  request: Request;
  runtimeContext: RuntimeContext;
  nonce?: string;
  renderLevel: RenderLevel;
}) {
  const { request, runtimeContext, nonce, renderLevel } = options;

  const url = new URL(request.url);

  const query = parseQuery(request);

  const { pathname, host } = url;

  const SSRData = {
    data: {
      initialData: runtimeContext.initialData,
      i18nData: runtimeContext.__i18nData__,
    },
    context: {
      reporter: {
        // TODO: reporter sessionId,
        // sessionId: tracker.sessionId,
      },

      request: {
        query,
        // TOOD: add params
        params: {},
        pathname,
        host,
        url: request.url,
        /// TODO unsafeContext,
        // ...(enableUnsafeCtx ? unsafeContext : {}),
      },
    },
    renderLevel,
  };
  const attrsStr = attributesToString({ nonce });

  const ssrDataScript = `
    <script${attrsStr}>window._SSR_DATA = ${serializeJson(SSRData)}</script>
    `;

  return (template: string) =>
    safeReplace(template, SSR_DATA_PLACEHOLDER, ssrDataScript);
}
