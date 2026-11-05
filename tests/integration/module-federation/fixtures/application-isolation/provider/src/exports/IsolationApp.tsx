import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { createModernBridgeComponent } from '@modern-js/runtime/mf';

const Root = createRoot({ route: '/isolation' });
export default createModernBridgeComponent({ rootComponent: Root });
