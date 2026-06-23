import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';
import type { Root } from 'react-dom/client';

type GarfishPayload = {
  appName?: string;
  basename?: string;
  dom: Document | Element | ShadowRoot;
  props?: Record<string, unknown>;
};
type GarfishProvider = (payload?: GarfishPayload) => {
  render(payload?: GarfishPayload): void;
  destroy(): void;
};

declare const __GARFISH_EXPORTS__:
  | undefined
  | {
      provider?: GarfishProvider;
      registerProvider?: (provider: GarfishProvider) => void;
    };

declare global {
  interface Window {
    __GARFISH__?: boolean;
  }
}

const isDocument = (dom: GarfishPayload['dom']): dom is Document =>
  dom.nodeType === Node.DOCUMENT_NODE;

const getMountElement = (dom: GarfishPayload['dom']) => {
  if (isDocument(dom)) {
    return dom.getElementById('root') || dom.body;
  }
  const element = dom as Element;
  return (
    element.querySelector('#root') ||
    element.querySelector('[data-garfish-root]') ||
    element
  );
};
export const provider: GarfishProvider = initialPayload => {
  let root: Root | null = null;
  return {
    render(payload = initialPayload) {
      console.log('GarfishEntry render', payload);
      if (!payload) {
        return;
      }
      const mountElement = getMountElement(payload.dom);
      const ModernRoot = createRoot();
      root = render(<ModernRoot />, mountElement);
    },
    destroy() {
      root?.unmount();
      root = null;
    },
  };
};

if (
  typeof window !== 'undefined' &&
  window.__GARFISH__ &&
  typeof __GARFISH_EXPORTS__ !== 'undefined'
) {
  console.log(3222);
  __GARFISH_EXPORTS__.provider = provider;
}

if (typeof window !== 'undefined' && !window.__GARFISH__) {
  const standaloneRoot = document.getElementById('root');
  if (standaloneRoot) {
    const ModernRoot = createRoot();

    render(<ModernRoot />);
  }
}

console.log('GarfishEntry executed', provider);

export default provider;
