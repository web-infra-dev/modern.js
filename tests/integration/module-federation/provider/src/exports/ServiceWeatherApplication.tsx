import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { createModernBridgeComponent } from '@modern-js/runtime/mf';

const WeatherRoot = createRoot({ route: '/weather-application' });
export default createModernBridgeComponent({
  rootComponent: WeatherRoot,
  isService: true,
});
