import { serializeJson } from '@modern-js/runtime-utils/node';
import { StaticHandlerContext } from '@modern-js/runtime-utils/remix-router';
import { parseHeaders, parseQuery } from '@modern-js/runtime-utils/universal';
import { attributesToString, serializeErrors } from '../utils';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../constants';
import { HandleRequestConfig } from '../requestHandler';
import { Collector, ChunkSet } from './types';

export interface SSRDataCreatorOptions {
  request: Request;
  prefetchData: Record<string, any>;
  chunkSet: ChunkSet;
  routerContext?: StaticHandlerContext;
  config?: HandleRequestConfig;
  nonce?: string;
}

export class SSRDataCollector implements Collector {
  #options: SSRDataCreatorOptions;

  constructor(options: SSRDataCreatorOptions) {
    this.#options = options;
  }

  effect() {
    const { request, routerContext, chunkSet } = this.#options;

    const ssrData = this.#getSSRData(request);
    const routerData = routerContext
      ? {
          loaderData: routerContext.loaderData,
          errors: serializeErrors(routerContext.errors),
        }
      : undefined;

    const ssrDataScripts = this.#getSSRDataScripts(ssrData, routerData);

    chunkSet.ssrScripts = ssrDataScripts;
  }

  #getSSRData(request: Request): Record<string, any> {
    const { prefetchData, chunkSet } = this.#options;

    const url = new URL(request.url);
    const query = parseQuery(request);
    const { pathname, host } = url;

    const headerData = parseHeaders(request);

    return {
      data: prefetchData,
      context: {
        request: {
          // TODO: support params
          //  confirm it is need?
          query,
          pathname,
          host,
          url: request.url,
          headers: headerData,
        },
      },
      renderLevel: chunkSet.renderLevel,
    };
  }

  #getSSRDataScripts(
    ssrData: Record<string, any>,
    routerData?: Record<string, any>,
  ) {
    const { config, nonce } = this.#options;
    const { inlineScript } = config || {};

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
