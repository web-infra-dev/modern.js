import { RuntimeContext } from '@modern-js/runtime-core';
import { renderToStaticMarkup } from 'react-dom/server';
import { run } from './hook';

// todo: SSRContext
const prefetch = async (
  App: React.ComponentType<any>,
  context: RuntimeContext,
) =>
  run(context.ssrContext.request.headers, async () => {
    renderToStaticMarkup(<App context={context} />);

    if (!context.loaderManager.hasPendingLoaders()) {
      return {};
    }

    const loadersData = await context.loaderManager.awaitPendingLoaders();

    return {
      loadersData,
      // todo: move to plugin state
      storeState: context?.store?.getState(),
    };
  });

export default prefetch;
