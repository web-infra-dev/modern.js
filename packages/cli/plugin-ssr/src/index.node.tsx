// eslint-disable-next-line filenames/match-exported
import path from 'path';
import { createPlugin, registerPrefetch } from '@modern-js/runtime-core';
import prefetch from './prefetch';

export { useHeaders } from './hook';

const registeredApps = new WeakSet();

const plugin: any = () =>
  createPlugin(
    () => ({
      server: async ({ App, context }) => {
        if (!registeredApps.has(App)) {
          registerPrefetch(App, _context => prefetch(App, _context));
          registeredApps.add(App);
        }

        if (typeof window === 'undefined') {
          const html = await require('./serverRender').render(
            context,
            context?.ssrContext.distDir || path.join(process.cwd(), 'dist'),
            App,
          );

          return html;
        }

        return null;
      },
      pickContext: ({ context, pickedContext }, next) =>
        next({
          context,
          pickedContext: {
            ...pickedContext,
            request: context?.ssrContext?.request,
          },
        }),
    }),
    { name: '@modern-js/plugin-ssr' },
  );

export default plugin;
export * from './react';
