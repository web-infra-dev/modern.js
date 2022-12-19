export const EN_LOCALE = {
  success_js: `Plugin dependency installed successfully! Please add the following code to {configFile}:

import {pluginName} from '{pluginDependence}';

module.exports = {
  ...,
  plugins: [..., {pluginName}()],
};
`,
  success_ts: `Plugin dependency installed successfully! Please add the following code to {configFile}:

import {pluginName} from '{pluginDependence}';

export default defineConfig({
  ...,
  plugins: [..., {pluginName}()],
});
`,
};
