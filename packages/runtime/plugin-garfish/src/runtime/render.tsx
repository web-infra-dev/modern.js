import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';

declare const __GARFISH_EXPORTS__: string;

export function isRenderGarfish(params?: { appName?: string }) {
  const renderByGarfish =
    typeof __GARFISH_EXPORTS__ !== 'undefined' ||
    (typeof window !== 'undefined' &&
      window.Garfish &&
      window.Garfish.activeApps &&
      window.Garfish.activeApps.some(
        app => app.appInfo?.name === params?.appName,
      ));
  return renderByGarfish;
}

function canContinueRender({
  dom,
  appName,
}: {
  dom: HTMLElement;
  appName: string;
}) {
  const renderByGarfish = isRenderGarfish({ appName });
  const renderByProvider = dom || appName;
  if (renderByGarfish) {
    // Runs in the Garfish environment and is rendered by the provider
    if (renderByProvider) {
      return true;
    } else {
      // Runs in the Garfish environment and is not rendered by the provider
      return false;
    }
  } else {
    // Running in a non-Garfish environment
    return true;
  }
}

export async function garfishRender(mountId?: string, _params?: any) {
  const { basename, props, dom, appName } =
    // eslint-disable-next-line prefer-rest-params
    (typeof arguments[1] === 'object' && arguments[1]) || {};
  if (canContinueRender({ dom, appName })) {
    const ModernRoot = createRoot(null, { router: { basename } });
    return await render(
      <ModernRoot basename={basename} {...props} />,
      dom || mountId,
    );
  }
  return null;
}
