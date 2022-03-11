// eslint-disable-next-line filenames/match-exported
import path from 'path';
import { createPlugin, registerPrefetch } from '@modern-js/runtime-core';
import { SSRServerContext } from './serverRender/type';
import prefetch from './prefetch';

export { run, useHeaders } from './hook';

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
      pickContext: ({ context, pickedContext }, next) => {
        const { request }: { request: SSRServerContext['request'] } =
          context?.ssrContext;

        const {
          cookie,
          'user-agent': userAgent,
          referer,
        } = request.headers || {};

        return next({
          context,
          pickedContext: {
            ...pickedContext,
            request: {
              cookie,
              userAgent,
              referer,
              ...request,
            },
            // FIXME: error TS2322: Type '{ request: any; store: Store<any, AnyAction> & { use: UseModel; }; }' is not assignable to type 'TRuntimeContext'. Object literal may only specify known properties, and 'request' does not exist in type 'TRuntimeContext'.
          } as any,
        });
      },
    }),
    { name: '@modern-js/plugin-ssr' },
  );

export default plugin;
export * from './react';
