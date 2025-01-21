import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';
import type { SSRRenderOptions } from './ssrRender';

export const renderRscHandler = async (
  req: Request,
  { serverManifest, routeInfo, rscClientManifest }: SSRRenderOptions,
) => {
  const serverBundle =
    serverManifest?.renderBundles?.[routeInfo.entryName || MAIN_ENTRY_NAME];

  if (!serverBundle) {
    return new Response('Cannot find server bundle for RSC', { status: 500 });
  }

  const { renderRscHandler } = serverBundle;

  if (!renderRscHandler) {
    return new Response('Cannot find request handler for RSC', { status: 500 });
  }

  if (!rscClientManifest) {
    return new Response('Cannot find rsc client manifest', { status: 500 });
  }

  return renderRscHandler({
    clientManifest: rscClientManifest,
  });
};
