export const EN_LOCALE = {
  success_js: `Plugin dependency installed successfully! Please add the following code to {configFile}:

import {pluginName} from '{pluginDependence}';
import {bffPluginName} from '{bffPluginDependence}';

module.exports = {
  ...,
  plugins: [..., {pluginName}(), {bffPluginName}()],
};
  `,
  success_ts: `Plugin dependency installed successfully! Please add the following code to {configFile}:

import {pluginName} from '{pluginDependence}';
import {bffPluginName} from '{bffPluginDependence}';

export default defineConfig({
  ...,
  plugins: [..., {pluginName}(), {bffPluginName}()],
});
  `,
};
