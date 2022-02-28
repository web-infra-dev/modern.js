export const makeProvider = () => `
  function generateRouterBaseName(basename) {
    if (!App.config) {
      App.config = {};
    }
    if (App.config.router) {
      App.config.router.historyOptions = {
        ...App.config.router.historyOptions,
      };
    } else {
      App.config.router = {
        historyOptions: {
          basename: basename
        }
      };
    }
  }

  export const provider = function ({basename, dom, ...props}) {
    return {
      render({basename, dom}) {
        console.log('App.config', App.config);
        const SubApp = render(props, basename);
        const node = dom.querySelector('#' + MOUNT_ID) || dom;
        generateRouterBaseName(basename);
        bootstrap(SubApp, node);
      },
      destroy({ dom }) {
        const node = dom.querySelector('#' + MOUNT_ID) || dom;

        if (node) {
          unmountComponentAtNode(node);
        }
      },
      SubModuleComponent: (props) => {
        const SubApp = render(props, basename);

        return createPortal(<SubApp />, dom.querySelector('#' + MOUNT_ID)  || dom);
      }
    }
  };
  if (typeof __GARFISH_EXPORTS__ !== 'undefined') {
    __GARFISH_EXPORTS__.provider = provider;
  }
`;

export const makeRenderFunction = (code: string) =>
  code.replace(
    'IS_BROWSER',
    `
        IS_BROWSER &&
        typeof __GARFISH_EXPORTS__ === 'undefined'
      `,
  );
