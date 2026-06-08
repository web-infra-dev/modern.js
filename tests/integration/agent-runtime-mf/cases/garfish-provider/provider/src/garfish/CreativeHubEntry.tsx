import { type Root, createRoot } from 'react-dom/client';

type GarfishPayload = {
  basename?: string;
  dom: Document | Element | ShadowRoot;
};

type GarfishProvider = (payload?: GarfishPayload) => {
  render(payload?: GarfishPayload): void;
  destroy(): void;
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
  return element.querySelector('#root') || element;
};

function CreativeHubApp() {
  return (
    <section data-testid="creative-hub-subapp">
      <strong>Garfish: creative-hub</strong>
      <p>Orders page mounted from the child app provider.</p>
    </section>
  );
}

export const provider: GarfishProvider = initialPayload => {
  let root: Root | null = null;
  return {
    render(payload = initialPayload) {
      if (!payload) {
        return;
      }
      root = createRoot(getMountElement(payload.dom));
      root.render(<CreativeHubApp />);
    },
    destroy() {
      root?.unmount();
      root = null;
    },
  };
};

if (typeof window !== 'undefined' && !window.__GARFISH__) {
  const standaloneRoot = document.getElementById('root');
  if (standaloneRoot) {
    createRoot(standaloneRoot).render(<CreativeHubApp />);
  }
}

export default provider;
