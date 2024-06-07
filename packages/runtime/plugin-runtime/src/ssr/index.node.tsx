import type { Plugin } from '../core';
import type {
  SSRPluginConfig,
  ModernSSRReactComponent,
} from './serverRender/types';
import { formatServer } from './utils';
import render from './serverRender';
import { createSSRTracker } from './serverRender/tracker';

export const ssr = (config: SSRPluginConfig = {}): Plugin => ({
  name: '@modern-js/plugin-ssr',
  setup: () => {
    return {
      server: async ({ App, context }) => {
        const html = await render({
          context,
          App: App as ModernSSRReactComponent,
          config,
        });
        return html;
      },
      init({ context }, next) {
        const { request } = context.ssrContext!;

        context.ssrContext!.request = formatServer(request);
        context.ssrContext!.mode = config.mode;
        context.ssrContext!.tracker = createSSRTracker(context.ssrContext!);

        if (!context.ssrContext!.htmlModifiers) {
          context.ssrContext!.htmlModifiers = [];
        }

        return next({ context });
      },
    };
  },
});

export default ssr;
export * from './react';
