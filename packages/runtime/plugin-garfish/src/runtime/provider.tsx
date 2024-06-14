import { createRoot } from '@modern-js/runtime/react';
import { render } from '@modern-js/runtime/client';
import { Root } from 'react-dom/client';
import { createPortal } from 'react-dom';

export function createProvider(id?: string) {
  return ({ basename, dom }: { basename: string; dom: HTMLElement }) => {
    let root: HTMLElement | Root | null = null;
    return {
      async render({
        basename,
        dom,
        props,
      }: {
        basename: string;
        dom: HTMLElement;
        props: any;
      }) {
        const ModernRoot = createRoot(null, { router: { basename } });

        root = await render(<ModernRoot basename={basename} {...props} />, dom);
      },
      destroy({ dom }: { dom: HTMLElement }) {
        const node = dom.querySelector(`#${id || 'root'}`) || dom;
        if (node) {
          (root as any).unmount();
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
