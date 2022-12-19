export const EN_LOCALE = {
  successJS: `Plugin dependency installed successfully! Please add the following code to {configFile}:

import {pluginName} from '{pluginDependence}';

module.exports = {
  ...,
  plugins: [..., {pluginName}()],
};
`,
  successTs: `Plugin dependency installed successfully! Please add the following code to {configFile}:

import {pluginName} from '{pluginDependence}';

export default defineConfig({
  ...,
  plugins: [..., {pluginName}()],
});
`,
};
