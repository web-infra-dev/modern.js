export const makeProvider = () => `
  export const provider = function ({basename, dom, ...props}) {
    return {
      render({basename, dom}) {
        const SubApp = render(props, basename);
        const node = dom.querySelector('#' + MOUNT_ID) || dom;

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
      },
      jupiter_submodule_app_key: () => {
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
  code
    .replace(
      'IS_BROWSER',
      `
        IS_BROWSER &&
        typeof __GARFISH_EXPORTS__ === 'undefined'
      `,
    )
    .replace('(App)', '(() => <App {...(arguments[0] || {})} />)')
    .replace('"basename":"/"', '"basename":arguments[1] || "/"');
