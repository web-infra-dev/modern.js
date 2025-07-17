import { type RenderFunc, render } from '@meta/runtime/browser';
import { createRoot } from '@meta/runtime/react';
import { createPortal } from 'react-dom';
import type { Root } from 'react-dom/client';

function generateRootDom(dom: HTMLElement, id: string) {
  const mountNode = dom
    ? dom.querySelector(`#${id}`) || dom
    : document.getElementById(id);
  return mountNode as HTMLElement;
}

export function createProvider(
  id?: string,
  {
    beforeRender,
  }: {
    beforeRender?: (
      App: React.ComponentType,
      props?: Record<string, any>,
    ) => Promise<any>;
  } = {},
) {
  return ({ basename, dom }: { basename: string; dom: HTMLElement }) => {
    let root: HTMLElement | Root | null = null;
    return {
      async render({
        basename,
        dom,
        props,
        appName,
      }: {
        basename: string;
        dom: HTMLElement;
        props: any;
        appName?: string;
      }) {
        const ModernRoot = createRoot(null);
        const mountNode = generateRootDom(dom, id || 'root');

        if (beforeRender) {
          await beforeRender(ModernRoot, { basename, appName, ...props });
        }
        root = await render(
          <ModernRoot basename={basename} appName={appName} {...props} />,
          mountNode,
        );
      },
      destroy({ dom }: { dom: HTMLElement }) {
        const node = dom.querySelector(`#${id || 'root'}`) || dom;
        if (node) {
          if (process.env.IS_REACT18 === 'true') {
            (root as any).unmount();
          } else {
            const { unmountComponentAtNode } = require('react-dom');
            unmountComponentAtNode(node);
          }
        }
      },
      // 兼容旧版本
      SubModuleComponent: (props: any) => {
        const ModernRoot = createRoot(null);
        return createPortal(
          <ModernRoot basename={basename} {...props} />,
          dom.querySelector(`#${id || 'root'}`) || dom,
        );
      },
      jupiter_submodule_app_key: (props: any) => {
        const ModernRoot = createRoot(null);

        return createPortal(
          <ModernRoot basename={basename} {...props} />,
          dom.querySelector(`#${id || 'root'}`) || dom,
        );
      },
    };
  };
}
