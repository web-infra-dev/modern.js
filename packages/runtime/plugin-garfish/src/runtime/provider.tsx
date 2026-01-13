import { type RenderFunc, render } from '@meta/runtime/browser';
import { createRoot } from '@meta/runtime/react';
import { createPortal, unmountComponentAtNode } from 'react-dom';
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
    customBootstrap,
    beforeRender,
    disableComponentCompat,
    basename: customBasename,
  }: {
    customBootstrap?: (
      App: React.ComponentType,
      render: RenderFunc,
    ) => Promise<HTMLElement | Root>;
    beforeRender?: (
      App: React.ComponentType,
      props?: Record<string, any>,
    ) => Promise<any>;
    disableComponentCompat?: boolean;
    basename?: string;
  } = {},
) {
  return ({ basename, dom }: { basename: string; dom: HTMLElement }) => {
    let root: HTMLElement | Root | null = null;
    const SubModuleComponent = disableComponentCompat
      ? null
      : (props: any) => {
          const ModernRoot = createRoot(null);
          return createPortal(
            <ModernRoot basename={basename} {...props} />,
            dom.querySelector(`#${id || 'root'}`) || dom,
          );
        };
    const jupiter_submodule_app_key = disableComponentCompat
      ? null
      : (props: any) => {
          const ModernRoot = createRoot(null);
          return createPortal(
            <ModernRoot basename={basename} {...props} />,
            dom.querySelector(`#${id || 'root'}`) || dom,
          );
        };
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
        const finalBasename = customBasename || basename;
        const ModernRoot = createRoot(null);
        const mountNode = generateRootDom(dom, id || 'root');
        if (customBootstrap) {
          root = await customBootstrap(ModernRoot, () =>
            render(
              <ModernRoot
                basename={finalBasename}
                appName={appName}
                {...props}
              />,
              mountNode,
            ),
          );
        } else {
          if (beforeRender) {
            await beforeRender(ModernRoot, {
              basename: finalBasename,
              appName,
              ...props,
            });
          }
          root = await render(
            <ModernRoot
              basename={finalBasename}
              appName={appName}
              {...props}
            />,
            mountNode,
          );
        }
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
      SubModuleComponent,
      jupiter_submodule_app_key,
    };
  };
}
