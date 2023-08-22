/* eslint-disable node/no-unsupported-features/es-builtins */
/* eslint-disable node/prefer-global/url-search-params */
/* eslint-disable node/prefer-global/url */
/* eslint-disable node/no-unsupported-features/node-builtins */
// It will inject _SERVER_DATA twice, when SSG mode.
// The first time was in ssg html created, the seoncd time was in prod-server start.
// but the second wound causes route error.

import { Readable } from 'stream';
import vm from 'vm';
import { Buffer } from 'buffer';
import { fs, SERVER_RENDER_FUNCTION_NAME } from '@modern-js/utils';
import type { ModernServerContext } from '@modern-js/types';
import { TemplateAPI } from '../hook-api/template';
import { templateInjectableStream } from '../hook-api/templateForStream';
import { SSRServerContext } from './type';
import cache from './cache';

// To ensure that the second injection fails, the _SERVER_DATA inject at the front of head,
export const injectServerData = (
  content: string,
  context: ModernServerContext,
) => {
  const template = new TemplateAPI(content);
  template.prependHead(
    `<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
      context.serverData,
    )}</script>`,
  );
  return template.get();
};

export const injectServerDataStream = (
  content: Readable,
  context: ModernServerContext,
) => {
  return content.pipe(
    templateInjectableStream({
      prependHead: `<script type="application/json" id="__MODERN_SERVER_DATA__">${JSON.stringify(
        context.serverData,
      )}</script>`,
    }),
  );
};

const vmCache = new Map<string, vm.Script>();

export const runServerRender = async ({
  ctx,
  serverContext,
  bundleJS,
  enableVM,
}: {
  ctx: ModernServerContext;
  bundleJS: string;
  enableVM?: boolean;
  serverContext: SSRServerContext;
}) => {
  if (enableVM) {
    const vmStart = Date.now();
    const global: Partial<typeof globalThis> & {
      __SERVER_RENDER__: (ctx: SSRServerContext) => Promise<string>;
    } = {
      __SERVER_RENDER__: async (_: SSRServerContext) => '',
      Buffer,
      // Node 0.10.0+
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      console: {
        assert: (...args) => console.assert(...args),
        clear: (...args) => console.clear(...args),
        count: (...args) => console.count(...args),
        countReset: (...args) => console.countReset(...args),
        debug: (...args) => console.debug(...args),
        dir: (...args) => console.dir(...args),
        dirxml: (...args) => console.dirxml(...args),
        error: (...args) => console.error(...args),
        group: (...args) => console.group(...args),
        groupCollapsed: (...args) => console.groupCollapsed(...args),
        groupEnd: (...args) => console.groupEnd(...args),
        info: (...args) => console.info(...args),
        log: (...args) => console.log(...args),
        profile: (...args) => console.profile(...args),
        profileEnd: (...args) => console.profileEnd(...args),
        table: (...args) => console.table(...args),
        time: (...args) => console.time(...args),
        timeEnd: (...args) => console.timeEnd(...args),
        timeLog: (...args) => console.timeLog(...args),
        timeStamp: (...args) => console.timeStamp(...args),
        trace: (...args) => console.trace(...args),
        warn: (...args) => console.warn(...args),
      } as typeof console,
      // Node 8.5.0+
      performance: {
        ...performance,
      } as typeof performance,
      // Node 10+
      URL,
      URLSearchParams,
      // Node 11+
      queueMicrotask,
      require,
      exports: {},
      process,
      // @ts-expect-error
      global: {},
    };
    // Node 16+
    if (globalThis.atob !== undefined) {
      global.atob = atob;
    }
    if (globalThis.btoa !== undefined) {
      global.btoa = btoa;
    }
    // Node 17+
    if (globalThis.structuredClone !== undefined) {
      global.structuredClone = structuredClone;
    }
    // Node 18+
    if (globalThis.fetch !== undefined) {
      global.fetch = fetch;
      global.Request = globalThis.Request;
      global.Response = globalThis.Response;
      global.Headers = globalThis.Headers;
    }
    const cached = vmCache.has(bundleJS);
    if (!cached) {
      vmCache.set(
        bundleJS,
        new vm.Script(await fs.readFile(bundleJS, 'utf-8')),
      );
    }
    const script = vmCache.get(bundleJS)!;
    const vmEnd = Date.now();
    serverContext.serverTiming.addServeTiming(
      `vm-${cached ? 'cached' : 'new'}`,
      vmEnd - vmStart,
    );
    script.runInNewContext(global);
    return global.__SERVER_RENDER__(serverContext);
  }
  const bundleJSContent = await Promise.resolve(require(bundleJS));
  const serverRender = bundleJSContent[SERVER_RENDER_FUNCTION_NAME];
  return cache(serverRender, ctx)(serverContext);
};
