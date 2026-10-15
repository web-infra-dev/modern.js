import '@modern-js/runtime/registry/index';
import { hydrate, render, renderStream } from '@modern-js/runtime/mf';
import { createRoot } from '@modern-js/runtime/react';
import { createBridgeComponent } from '@module-federation/modern-js-v3/react-v19';

const ModernRoot = createRoot();

export const provider = createBridgeComponent({
  rootComponent: ModernRoot,
  render,
  hydrate,
  renderStream,
});

export default provider;
