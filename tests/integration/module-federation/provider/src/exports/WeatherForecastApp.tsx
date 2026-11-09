import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { createModernBridgeComponent } from '@modern-js/runtime/mf';

const ModernRoot = createRoot({ route: '/weather/forecast' });
export default createModernBridgeComponent({ rootComponent: ModernRoot });
