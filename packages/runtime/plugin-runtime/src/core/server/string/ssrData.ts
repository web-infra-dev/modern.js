import type { IncomingHttpHeaders } from 'http';
import { createDataScript } from '@modern-js/render/html';
import type { StaticHandlerContext } from '@modern-js/runtime-utils/router';
import type { HeadersData } from '@modern-js/runtime-utils/universal/request';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../../constants';
import type { TRuntimeContext } from '../../context';
import type { SSRContainer, SSRServerContext } from '../../types';
import type { SSRConfig } from '../shared';
import { serializeErrors } from '../utils';
import type { ChunkSet, Collector } from './types';

export interface SSRDataCreatorOptions {
  runtimeContext: TRuntimeContext;
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
        i18nData: runtimeContext.__i18nData__ as Record<string, unknown>,
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
    ssrData: SSRContainer,
    routerData?: Record<string, unknown>,
  ) {
    const { nonce, useJsonScript = false } = this.#options;
    let ssrDataScripts = createDataScript({
      data: ssrData,
      ...(useJsonScript
        ? { id: SSR_DATA_JSON_ID }
        : { global: '_SSR_DATA', nonce }),
    });

    if (routerData) {
      ssrDataScripts += `\n${createDataScript({
        data: routerData,
        ...(useJsonScript
          ? { id: ROUTER_DATA_JSON_ID }
          : { global: '_ROUTER_DATA', nonce }),
      })}`;
    }
    return ssrDataScripts;
  }
}
