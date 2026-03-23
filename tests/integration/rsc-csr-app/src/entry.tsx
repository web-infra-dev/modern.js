import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';

declare global {
  interface Window {
    __ENTRY_BEFORE_RENDER__?: string;
  }
}

const ModernRoot = createRoot();

async function beforeRender() {
  window.__ENTRY_BEFORE_RENDER__ = 'executed';
}

beforeRender().then(() => {
  render(<ModernRoot />);
});
