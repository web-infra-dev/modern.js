import type { NormalizedConfig } from '@modern-js/core';

export const makeProvider = () => `
export const provider = function ({basename, dom}) {
  return {
    render({basename, dom, props}) {
      const SubApp = render({ props, basename });
      const node = dom.querySelector('#' + MOUNT_ID) || dom;
      const App = function () {
        return React.createElement(SubApp, props)
      };
      bootstrap(App, node);
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
`;

export const makeRenderFunction = (code: string) => {
  const inGarfishToRender = `
  const { basename, props } = arguments[0] || {};
  let renderByGarfish = false;
  const renderByProvider = !!basename;

  if (IS_BROWSER && window.Garfish && window.Garfish.activeApps && window.Garfish.activeApps.length !== 0) renderByGarfish = true;
  if (IS_BROWSER && window.Garfish && window.Garfish.apps && Object.keys(window.Garfish.apps).length !== 0) renderByGarfish = true;
  if (typeof __GARFISH_EXPORTS__ !== 'undefined') renderByGarfish = true;
  if (renderByGarfish && !renderByProvider) return null;

  function RouterPlugin (routerConfig) {
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
  `;
  return (
    inGarfishToRender +
    code
      .replace(`router(`, `RouterPlugin(`)
      .replace('IS_BROWSER', `IS_BROWSER && !renderByGarfish`)
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
