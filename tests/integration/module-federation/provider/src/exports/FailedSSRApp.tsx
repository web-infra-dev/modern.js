import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { createBridgeComponent, render, hydrate } from '@modern-js/runtime/mf';

const ModernRoot = createRoot({ route: '/product' });

export default createBridgeComponent({
  rootComponent: ModernRoot,
  render,
  hydrate,
  async renderStream() {
    throw new Error('LAB_BRIDGE_SSR_FAILURE');
  },
});
