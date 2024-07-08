import { createRoot } from '@modern-js/runtime/react';
import type { Root } from 'react-dom/client';
import { createPortal, unmountComponentAtNode } from 'react-dom';
import { garfishRender } from './render';

export function createProvider(id?: string) {
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
        root = await garfishRender(id || 'root', {
          basename,
          dom,
          props,
          appName,
        });
      },
      destroy({ dom }: { dom: HTMLElement }) {
        const node = dom.querySelector(`#${id || 'root'}`) || dom;
        if (node) {
          if (process.env.IS_REACT18 === 'true') {
            (root as any).unmount();
          } else {
            unmountComponentAtNode(node);
          }
        }
      },
      // 兼容旧版本
      SubModuleComponent: (props: any) => {
        const ModernRoot = createRoot(null, { router: { basename } });
        return createPortal(
          <ModernRoot basename={basename} {...props} />,
          dom.querySelector(`#${id || 'root'}`) || dom,
        );
      },
      jupiter_submodule_app_key: (props: any) => {
        const ModernRoot = createRoot(null, { router: { basename } });

        return createPortal(
          <ModernRoot basename={basename} {...props} />,
          dom.querySelector(`#${id || 'root'}`) || dom,
        );
      },
    };
  };
}
