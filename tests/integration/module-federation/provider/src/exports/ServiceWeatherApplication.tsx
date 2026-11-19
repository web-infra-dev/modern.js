import '@modern-js/runtime/registry/index';
import { createRoot } from '@modern-js/runtime/react';
import { createModernBridgeComponent } from '@modern-js/runtime/mf';
// The Service HTML can arrive before its lazy route imports run in the browser.
import '../routes/weather-application/weather-application.css';
import '../routes/weather-application/report/report.css';

const WeatherRoot = createRoot({ route: '/weather-application' });
export default createModernBridgeComponent({
  rootComponent: WeatherRoot,
  isService: true,
});
