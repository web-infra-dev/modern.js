import { serializeJson } from '@modern-js/runtime-utils/node';
import { HeadersData } from '@modern-js/runtime-utils/universal/request';
import { attributesToString, safeReplace } from '../utils';
import { SSR_DATA_PLACEHOLDER } from '../constants';
import { BuildHtmlCb, SSRConfig, buildHtml } from '../shared';
import { RenderLevel } from '../../constants';
import { SSRContainer } from '../../types';
import { HandleRequestConfig } from '../requestHandler';
import { RuntimeContext } from '../../context';

export type BuildShellAfterTemplateOptions = {
  runtimeContext: RuntimeContext;
  renderLevel: RenderLevel;
  ssrConfig: SSRConfig;
  request: Request;
  config: HandleRequestConfig;
};

export function buildShellAfterTemplate(
  afterAppTemplate: string,
  options: BuildShellAfterTemplateOptions,
) {
  const { request, config, ssrConfig, runtimeContext, renderLevel } = options;

  const callbacks: BuildHtmlCb[] = [
    createReplaceSSRData({
      request,
      ssrConfig,
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
  ssrConfig: SSRConfig;
  nonce?: string;
  renderLevel: RenderLevel;
}) {
  const { runtimeContext, nonce, renderLevel, ssrConfig } = options;

  const { request, reporter } = runtimeContext.ssrContext!;

  const headers =
    typeof ssrConfig === 'object' && ssrConfig.unsafeHeaders
      ? Object.fromEntries(
          Object.entries(request.headers as HeadersData).filter(([key, _]) => {
            return ssrConfig.unsafeHeaders
              ?.map(header => header.toLowerCase())
              ?.includes(key.toLowerCase());
          }),
        )
      : undefined;

  const ssrData: SSRContainer = {
    data: {
      initialData: runtimeContext.initialData,
      i18nData: runtimeContext.__i18nData__,
    },
    context: {
      reporter: {
        sessionId: reporter?.sessionId,
      },

      request: {
        query: request.query,
        params: request.params,
        pathname: request.pathname,
        host: request.host,
        url: request.url,
        headers,
      },
    },
    mode: 'stream',
    renderLevel,
  };
  const attrsStr = attributesToString({ nonce });

  const ssrDataScript = `
    <script${attrsStr}>window._SSR_DATA = ${serializeJson(ssrData)}</script>
    `;

  return (template: string) =>
    safeReplace(template, SSR_DATA_PLACEHOLDER, ssrDataScript);
}
