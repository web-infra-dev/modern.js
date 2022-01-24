export const makeProvider = () => `
  export function provider({basename, dom, ...props}) {
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
  }
`;

export const makeRenderFunction = (code: string) =>
  code
    .replace(
      'IS_BROWSER',
      `
        IS_BROWSER &&
        Object.keys(window.Garfish && window.Garfish.cacheApps || {}).length === 0 &&
        Object.keys(window.Garfish && window.Garfish.apps  || {}).length === 0 &&
        Object.keys(window.Garfish && window.Garfish.appInfos || {}).length === 0 &&
        (window.Garfish && window.Garfish.activeApps || []).length === 0`,
    )
    .replace('(App)', '(() => <App {...(arguments[0] || {})} />)')
    .replace('"basename":"/"', '"basename":arguments[1] || "/"');
