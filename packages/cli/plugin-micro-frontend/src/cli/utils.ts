export const makeProvider = (enableHtmlEntry?: boolean) => `
  export function provider({basename, dom, ...props}) {
    const SubApp = render(props, basename);

    return {
      render({basename, dom}) {
        const node = ${
          enableHtmlEntry ? 'true' : 'false'
        } ? dom.querySelector('#' + MOUNT_ID) : '#' + MOUNT_ID;

        bootstrap(SubApp, node);
      },
      destroy({ dom }) {
        const node = ${
          enableHtmlEntry ? 'true' : 'false'
        } ? dom.querySelector('#' + MOUNT_ID) : '#' + MOUNT_ID;

        if (node) {
          unmountComponentAtNode(node);
        }
      },
      ${enableHtmlEntry ? '' : 'SubModuleComponent: SubApp'}
    }
  }
  `;

export const makeRenderFunction = (code: string, enableHtmlEntry: boolean) =>
  code
    .replace(
      'IS_BROWSER',
      `IS_BROWSER && ${
        enableHtmlEntry ? 'true' : 'false'
      } ? (!window.Garfish || !window.Garfish.running) : false`,
    )
    .replace('(App)', '(() => <App {...(arguments[0] || {})} />)')
    .replace('"basename":"/"', '"basename":arguments[1] || "/"');
