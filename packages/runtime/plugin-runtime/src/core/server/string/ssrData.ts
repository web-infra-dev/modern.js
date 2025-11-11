import type { IncomingHttpHeaders } from 'http';
import { serializeJson } from '@modern-js/runtime-utils/node';
import type { StaticHandlerContext } from '@modern-js/runtime-utils/router';
import type { HeadersData } from '@modern-js/runtime-utils/universal/request';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../../constants';
import type { RuntimeContext } from '../../context';
import type { SSRContainer, SSRServerContext } from '../../types';
import type { SSRConfig } from '../shared';
import { attributesToString, serializeErrors } from '../utils';
import type { ChunkSet, Collector } from './types';

export interface SSRDataCreatorOptions {
  runtimeContext: RuntimeContext;
  request: Request;
  chunkSet: ChunkSet;
  ssrContext: SSRServerContext;
  ssrConfig?: SSRConfig;
  routerContext?: StaticHandlerContext;
  nonce?: string;
  useJsonScript?: boolean;
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
    const { chunkSet, ssrConfig, ssrContext, runtimeContext } = this.#options;

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
      data: {
        initialData: runtimeContext.initialData,
        i18nData: runtimeContext.__i18nData__,
      },
      context: {
        request: {
          params: request.params,
          query: request.query,
          pathname: request.pathname,
          host: request.host,
          url: request.url,
          headers: headers as IncomingHttpHeaders,
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
    const { nonce, useJsonScript = false } = this.#options;
    const serializeSSRData = serializeJson(ssrData);
    const attrsStr = attributesToString({ nonce });

    let ssrDataScripts = useJsonScript
      ? `<script type="application/json" id="${SSR_DATA_JSON_ID}">${serializeSSRData}</script>`
      : `<script${attrsStr}>window._SSR_DATA = ${serializeSSRData}</script>`;

    if (routerData) {
      const serializedRouterData = serializeJson(routerData);
      ssrDataScripts += useJsonScript
        ? `\n<script type="application/json" id="${ROUTER_DATA_JSON_ID}">${serializedRouterData}</script>`
        : `\n<script${attrsStr}>window._ROUTER_DATA = ${serializedRouterData}</script>`;
    }
    return ssrDataScripts;
  }
}
