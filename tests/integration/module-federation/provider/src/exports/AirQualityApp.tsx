import '@modern-js/runtime/registry/weather';
import { createRoot } from '@modern-js/runtime/react';
import { createModernBridgeComponent } from '@modern-js/runtime/mf';

const ModernRoot = createRoot({ route: '/air' });
export default createModernBridgeComponent({ rootComponent: ModernRoot });
