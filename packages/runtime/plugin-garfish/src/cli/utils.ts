import type { NormalizedConfig } from '@modern-js/core';

export const makeProvider = () => `
export const provider = function ({basename, dom}) {
  return {
    render({basename, dom, props, appName}) {
      render({ props, basename, dom, appName });
    },
    destroy({ dom }) {
      const node = dom.querySelector('#' + MOUNT_ID) || dom;

      if (node) {
        unmountComponentAtNode(node);
      }
    },
    SubModuleComponent: (props) => {
      const SubApp = render({props, basename});

      return createPortal(<SubApp />, dom.querySelector('#' + MOUNT_ID)  || dom);
    },
    jupiter_submodule_app_key: (props) => {
      const SubApp = render({props, basename});

      return createPortal(<SubApp />, dom.querySelector('#' + MOUNT_ID)  || dom);
    }
  }
};

if (typeof __GARFISH_EXPORTS__ !== 'undefined') {
  __GARFISH_EXPORTS__.provider = provider;
}

function canContinueRender ({ dom, appName }) {
  var renderByGarfish =
    typeof __GARFISH_EXPORTS__ !== 'undefined'
    || typeof window !== 'undefined' && window.Garfish && window.Garfish.activeApps && window.Garfish.activeApps.some((app)=>app.appInfo.name === appName);
  let renderByProvider = dom || appName;
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

function generateRouterPlugin (basename,routerConfig) {
  if (basename) {
    routerConfig.basename = basename;
    if (routerConfig.supportHtml5History !== false) {
      if (!routerConfig.historyOptions) {
        routerConfig.historyOptions = {
          basename: basename
        };
      } else {
        routerConfig.historyOptions.basename = basename;
      }
    }
  }
  return router(routerConfig);
}

function generateAppWrapperAndRootDom ({ App, props, dom }) {
  let AppWrapper = App;
  if (props) {
    AppWrapper = function () {
      return React.createElement(App, props);
    };
    AppWrapper = hoistNonReactStatics(AppWrapper, App);
  }
  const mountNode = dom ? (dom.querySelector('#' + MOUNT_ID) || dom) : MOUNT_ID;
  return { AppWrapper, mountNode }
}
`;

export const makeRenderFunction = (code: string) => {
  const inGarfishToRender = `
  const { basename, props, dom, appName } = typeof arguments[0] === 'object' && arguments[0] || {};
  if (!canContinueRender({ dom, appName })) return null;
  let { AppWrapper, mountNode } = generateAppWrapperAndRootDom({App, props, dom});
  `;
  return (
    inGarfishToRender +
    code
      .replace(`router(`, `generateRouterPlugin(basename,`)
      .replace('(App)', `(AppWrapper)`)
      .replace('MOUNT_ID', 'mountNode')
  );
};

// support legacy config
export function getRuntimeConfig(config: Partial<NormalizedConfig>) {
  if (config?.runtime?.features) {
    return config?.runtime?.features;
  }
  return config?.runtime || {};
}

// support legacy config
export function setRuntimeConfig(
  config: Partial<NormalizedConfig>,
  key: string,
  value: any,
): undefined {
  if (config?.runtime?.features && config?.runtime?.features[key]) {
    config.runtime.features[key] = value;
    return undefined;
  }
  if (config?.runtime && config?.runtime[key]) {
    config.runtime[key] = value;
    return undefined;
  }
  return undefined;
}
