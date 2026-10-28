import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { render } from '@modern-js/runtime/browser';
import { createBridgeComponent } from '@modern-js/runtime/mf';

const ModernRoot = createRoot({ route: '/product' });
export default createBridgeComponent({ rootComponent: ModernRoot, render });
