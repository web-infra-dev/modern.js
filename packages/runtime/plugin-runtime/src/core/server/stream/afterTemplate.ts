import type { IncomingHttpHeaders } from 'http';
import { serializeJson } from '@modern-js/runtime-utils/node';
import type { HeadersData } from '@modern-js/runtime-utils/universal/request';
import { type RenderLevel, SSR_DATA_JSON_ID } from '../../constants';
import type { TInternalRuntimeContext } from '../../context';
import type { SSRContainer } from '../../types';
import { SSR_DATA_PLACEHOLDER } from '../constants';
import type { HandleRequestConfig } from '../requestHandler';
import { type BuildHtmlCb, type SSRConfig, buildHtml } from '../shared';
import { attributesToString, safeReplace } from '../utils';

export type BuildShellAfterTemplateOptions = {
  runtimeContext: TInternalRuntimeContext;
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
      useJsonScript: config.useJsonScript,
      runtimeContext,
      renderLevel,
    }),
    template => injectJs(template, entryName, config.nonce),
  ];

  async function injectJs(template: string, entryName: string, nonce?: string) {
    const { routeManifest } = runtimeContext;
    if (!routeManifest) return template;
    const { routeAssets } = routeManifest;
    if (!routeAssets) return template;
    const asyncEntry = routeAssets[`async-${entryName}`];
    if (asyncEntry) {
      const { assets } = asyncEntry;
      const jsChunkStr = assets
        ?.filter((asset: string) => asset.endsWith('.js'))
        ?.map((asset: string) => {
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
  runtimeContext: TInternalRuntimeContext;
  ssrConfig: SSRConfig;
  nonce?: string;
  useJsonScript?: boolean;
  renderLevel: RenderLevel;
}) {
  const { runtimeContext, nonce, renderLevel, useJsonScript, ssrConfig } =
    options;

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
      i18nData: runtimeContext.__i18nData__ as Record<string, unknown>,
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
        headers: headers as IncomingHttpHeaders,
      },
    },
    mode: 'stream',
    renderLevel,
  };
  const attrsStr = attributesToString({ nonce });
  const serializeSSRData = serializeJson(ssrData);

  const ssrDataScript = useJsonScript
    ? `<script type="application/json" id="${SSR_DATA_JSON_ID}">${serializeSSRData}</script>`
    : `<script${attrsStr}>window._SSR_DATA = ${serializeSSRData}</script>`;

  return (template: string) =>
    safeReplace(template, SSR_DATA_PLACEHOLDER, ssrDataScript);
}
