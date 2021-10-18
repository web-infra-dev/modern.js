export const makeProvider = () => `
  export function provider({basename, dom, ...props}) {
    return {
      render({basename, dom}) {
        const SubApp = render(props, basename);
        const node = dom.querySelector('#' + MOUNT_ID);

        bootstrap(SubApp, node);
      },
      destroy({ dom }) {
        const node = dom.querySelector('#' + MOUNT_ID);

        if (node) {
          unmountComponentAtNode(node);
        }
      },
      SubModuleComponent: (props) => {
        const SubApp = render(props, basename);

        return createPortal(<SubApp />, dom.querySelector('#' + MOUNT_ID));
      }
    }
  }
  `;

export const makeRenderFunction = (code: string) =>
  code
    .replace(
      'IS_BROWSER',
      'IS_BROWSER && (!window.Garfish || !window.Garfish.running)',
    )
    .replace('(App)', '(() => <App {...(arguments[0] || {})} />)')
    .replace('"basename":"/"', '"basename":arguments[1] || "/"');
