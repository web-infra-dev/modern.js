import { registerPrefetch } from '../core';
import type { Plugin } from '../core';
import {
  SSRServerContext,
  SSRPluginConfig,
  ModernSSRReactComponent,
} from './serverRender/types';
import prefetch from './prefetch';
import { formatServer } from './utils';
import render from './serverRender';

const registeredApps = new WeakSet();

export const ssr = (config: SSRPluginConfig = {}): Plugin => ({
  name: '@modern-js/plugin-ssr',
  setup: () => {
    return {
      server: async ({ App, context }) => {
        if (!registeredApps.has(App)) {
          registerPrefetch(App, _context => prefetch(App, _context));
          registeredApps.add(App);
        }

        const html = await render({
          context: context!,
          App: App as ModernSSRReactComponent,
          config,
        });
        return html;
      },
      init({ context }, next) {
        const { request }: { request: SSRServerContext['request'] } =
          context.ssrContext!;

        context.ssrContext!.request = formatServer(request);
        return next({ context });
      },
      pickContext: ({ context, pickedContext }, next) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        const { request, response } = context?.ssrContext!;
        const { initialData } = context;

        return next({
          context,
          pickedContext: {
            ...pickedContext,
            initialData,
            request,
            response,
          },
        });
      },
    };
  },
});

export default ssr;
export * from './react';
