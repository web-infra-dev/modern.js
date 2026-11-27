import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import {
  createBridgeComponent,
  render,
  hydrate,
  renderStream,
} from '@modern-js/runtime/mf';

const ModernRoot = createRoot({ route: '/orders' });
export default createBridgeComponent({
  rootComponent: ModernRoot,
  render,
  hydrate,
  renderStream,
});
