import type { AppNormalizedConfig } from '@modern-js/app-tools';

export const makeProvider = () => `
export const provider = function ({basename, dom}) {
  return {
    render({basename, dom, props, appName}) {
      render({ props, basename, dom, appName });
    },
    destroy({ dom }) {
      const node = dom.querySelector('#' + MOUNT_ID) || dom;

      if (node) {
        if (IS_REACT18) {
          root.unmount();
        } else {
          unmountComponentAtNode(node);
        }
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

function generateRootDom ({ dom, props, basename }) {
  const mountNode = dom ? (dom.querySelector('#' + MOUNT_ID) || dom) : document.getElementById(MOUNT_ID);
  const mergedProps = {
    ...props,
    basename,
  }
  return { mountNode, props: mergedProps }
}
`;

export const makeRenderFunction = (code: string) => {
  const inGarfishToRender = `
  let { basename, props, dom, appName } = typeof arguments[0] === 'object' && arguments[0] || {};
  if (!canContinueRender({ dom, appName })) return null;
  const rootDomInfo = generateRootDom({dom, props, basename});
  let mountNode = rootDomInfo.mountNode;
  props = rootDomInfo.props;
  `;

  return (
    inGarfishToRender +
    code
      .replace(`router(`, `generateRouterPlugin(basename,`)
      .replace(/MOUNT_ID/g, 'mountNode')
      .replace(`createApp({`, 'createApp({ props,')
      .replace(
        `bootstrap(AppWrapper, mountNode, root`,
        'bootstrap(AppWrapper, mountNode, root = IS_REACT18 ? ReactDOM.createRoot(mountNode) : null',
      )
      .replace(
        `customBootstrap(AppWrapper`,
        'customBootstrap(AppWrapper, mountNode',
      )
  );
};

// support legacy config
export function getRuntimeConfig(config: Partial<AppNormalizedConfig>) {
  if (config?.runtime?.features) {
    return config?.runtime?.features;
  }
  return config?.runtime || {};
}

// support legacy config
export function setRuntimeConfig(
  config: Partial<AppNormalizedConfig>,
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

export const generateAsyncEntry = (code: string) => {
  const transformCode = code.replace(
    `import('./bootstrap.jsx');`,
    `if (!window.__GARFISH__) { import('./bootstrap.jsx'); }`,
  );

  return `
      export const provider = async (...args) => {
        const exports = await import('./bootstrap');
        return exports.provider.apply(null, args);
      };
      ${transformCode}
      if (typeof __GARFISH_EXPORTS__ !== 'undefined') {
        __GARFISH_EXPORTS__.provider = provider;
      }
    `;
};
