import type { RuntimePlugin } from '@modern-js/plugin';
import { SSR_READY_EVENT } from './devUpdateEvent';

declare const module: {
  hot?: {
    on?(event: string, listener: (data: { name: string }) => void): void;
  };
};

const documents = new Set<(name: string) => void>();
if (typeof window !== 'undefined' && module.hot?.on)
  module.hot.on(SSR_READY_EVENT, ({ name }) => {
    for (const notify of documents) notify(name);
  });

/** Revalidate mounted document and fragment data after the host Node owner is ready. */
export const mfSSRUpdatePlugin = ({
  name,
}: {
  name: string;
}): RuntimePlugin<{
  extendContext: {
    application?: {
      output: 'document' | 'fragment';
      router?: { revalidate(): void | Promise<void> };
    };
  };
}> => ({
  name: '@modern-js/module-federation/ssr-ready',
  setup(api) {
    if (typeof window === 'undefined') return;
    const revalidate = () => {
      const router = api.getRuntimeContext().application?.router;
      if (router) void router.revalidate();
    };
    const notify = (owner: string) => {
      if (
        owner === name &&
        api.getRuntimeContext().application?.output === 'document'
      )
        window.dispatchEvent(new Event(SSR_READY_EVENT));
    };
    documents.add(notify);
    window.addEventListener(SSR_READY_EVENT, revalidate);
    api.onDispose(() => {
      documents.delete(notify);
      window.removeEventListener(SSR_READY_EVENT, revalidate);
    });
  },
});
