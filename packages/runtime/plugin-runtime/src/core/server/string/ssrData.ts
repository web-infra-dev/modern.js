import { serializeJson } from '@modern-js/runtime-utils/node';
import { StaticHandlerContext } from '@modern-js/runtime-utils/remix-router';
import { HeadersData } from '@modern-js/runtime-utils/universal';
import { attributesToString, serializeErrors } from '../utils';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../constants';
import { SSRConfig } from '../shared';
import { SSRContainer, SSRServerContext } from '../../types';
import { Collector, ChunkSet } from './types';

export interface SSRDataCreatorOptions {
  request: Request;
  prefetchData: Record<string, any>;
  chunkSet: ChunkSet;
  ssrContext: SSRServerContext;
  ssrConfig?: SSRConfig;
  routerContext?: StaticHandlerContext;
  nonce?: string;
}

export class SSRDataCollector implements Collector {
  #options: SSRDataCreatorOptions;

  constructor(options: SSRDataCreatorOptions) {
    this.#options = options;
  }

  effect() {
    const { routerContext, chunkSet } = this.#options;

    const ssrData = this.#getSSRData();
    const routerData = routerContext
      ? {
          loaderData: routerContext.loaderData,
          errors: serializeErrors(routerContext.errors),
        }
      : undefined;

    const ssrDataScripts = this.#getSSRDataScripts(ssrData, routerData);

    chunkSet.ssrScripts = ssrDataScripts;
  }

  #getSSRData(): SSRContainer {
    const { prefetchData, chunkSet, ssrConfig, ssrContext } = this.#options;

    const { reporter, request } = ssrContext;

    const headers =
      typeof ssrConfig === 'object' && ssrConfig.unsafeHeaders
        ? Object.fromEntries(
            Object.entries(request.headers as HeadersData).filter(
              ([key, _]) => {
                return ssrConfig.unsafeHeaders
                  ?.map(header => header.toLowerCase())
                  ?.includes(key.toLowerCase());
              },
            ),
          )
        : undefined;

    return {
      data: prefetchData,
      context: {
        request: {
          params: request.params,
          query: request.query,
          pathname: request.pathname,
          host: request.host,
          url: request.raw.url,
          headers,
        },
        reporter: {
          sessionId: reporter?.sessionId,
        },
      },
      mode: 'string',
      renderLevel: chunkSet.renderLevel,
    };
  }

  #getSSRDataScripts(
    ssrData: Record<string, any>,
    routerData?: Record<string, any>,
  ) {
    const { nonce, ssrConfig } = this.#options;
    const inlineScript =
      typeof ssrConfig === 'boolean' ? true : ssrConfig?.inlineScript !== false;

    const useInlineScript = inlineScript !== false;
    const serializeSSRData = serializeJson(ssrData);
    const attrsStr = attributesToString({ nonce });

    let ssrDataScripts = useInlineScript
      ? `<script${attrsStr}>window._SSR_DATA = ${serializeSSRData}</script>`
      : `<script type="application/json" id="${SSR_DATA_JSON_ID}">${serializeSSRData}</script>`;

    if (routerData) {
      const serializedRouterData = serializeJson(routerData);
      ssrDataScripts += useInlineScript
        ? `\n<script${attrsStr}>window._ROUTER_DATA = ${serializedRouterData}</script>`
        : `\n<script type="application/json" id="${ROUTER_DATA_JSON_ID}">${serializedRouterData}</script>`;
    }
    return ssrDataScripts;
  }
}
