import '@modern-js/runtime/registry/index';
import { createModernBridgeComponent } from '@modern-js/runtime/mf';
import { createRoot } from '@modern-js/runtime/react';

const Root = createRoot({ route: '/memory-demo' });
export default createModernBridgeComponent({ rootComponent: Root });
