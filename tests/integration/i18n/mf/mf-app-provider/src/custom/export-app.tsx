import '@modern-js/runtime/registry/custom';
import { render } from '@modern-js/runtime/browser';
import { createRoot } from '@modern-js/runtime/react';
import { createBridgeComponent } from '@module-federation/bridge-react/v19';
import type { ReactElement } from 'react';

const ModernRoot = createRoot();

export const provider = createBridgeComponent({
  rootComponent: ModernRoot,
  render: (Component, dom) =>
    render(Component as ReactElement<{ basename: string }>, dom),
});

export default provider;
