import { serializeJson } from '@modern-js/runtime-utils/node';
import type { HeadersData } from '@modern-js/runtime-utils/universal/request';
import { type RenderLevel, SSR_DATA_JSON_ID } from '../../constants';
import type { RuntimeContext } from '../../context';
import type { SSRContainer } from '../../types';
import { SSR_DATA_PLACEHOLDER } from '../constants';
import type { HandleRequestConfig } from '../requestHandler';
import { type BuildHtmlCb, type SSRConfig, buildHtml } from '../shared';
import { attributesToString, safeReplace } from '../utils';

export type BuildShellAfterTemplateOptions = {
  runtimeContext: RuntimeContext;
  renderLevel: RenderLevel;
  ssrConfig: SSRConfig;
  request: Request;
  entryName: string;
  config: HandleRequestConfig;
};

export function buildShellAfterTemplate(
  afterAppTemplate: string,
  options: BuildShellAfterTemplateOptions,
) {
  const { request, config, ssrConfig, runtimeContext, renderLevel, entryName } =
    options;

  const callbacks: BuildHtmlCb[] = [
    createReplaceSSRData({
      request,
      ssrConfig,
      nonce: config.nonce,
      runtimeContext,
      renderLevel,
    }),
    template => injectJs(template, entryName, config.nonce),
  ];

  async function injectJs(template: string, entryName: string, nonce?: string) {
    const { routeManifest } = runtimeContext;
    const { routeAssets } = routeManifest;
    const asyncEntry = routeAssets[`async-${entryName}`];
    if (asyncEntry) {
      const { assets } = asyncEntry;
      const jsChunkStr = assets
        ?.filter(asset => asset.endsWith('.js'))
        ?.map(asset => {
          return `<script src=${asset} nonce="${nonce}"></script>`;
        })
        .join(' ');
      if (jsChunkStr) {
        return safeReplace(template, '<!--<?- chunksMap.js ?>-->', jsChunkStr);
      }
    }
    return template;
  }

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

  const inlineScript =
    typeof ssrConfig === 'boolean' ? true : ssrConfig?.inlineScript !== false;
  const useInlineScript = inlineScript !== false;
  const serializeSSRData = serializeJson(ssrData);

  const ssrDataScript = useInlineScript
    ? `
    <script${attrsStr}>window._SSR_DATA = ${serializeSSRData}</script>
    `
    : `<script type="application/json" id="${SSR_DATA_JSON_ID}">${serializeSSRData}</script>`;

  return (template: string) =>
    safeReplace(template, SSR_DATA_PLACEHOLDER, ssrDataScript);
}
