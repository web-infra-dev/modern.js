export const EN_LOCALE = {
  successJS: `Plugin dependency installed successfully! Please add the following code to {configFile}:

import {pluginName} from '{pluginDependence}';

module.exports = {
  ...,
  runtime: {
    ...,
    router: {
      mode: 'react-router-5',
    },
  },
  plugins: [..., {pluginName}()],
};

After add code, you will use React Router v5 in your project, please use React Router v5 API from '@modern-js/runtime/router-v5'.
  `,
  successTs: `Plugin dependency installed successfully! Please add the following code to {configFile}:

import {pluginName} from '{pluginDependence}';

export default defineConfig({
  ...,
  runtime: {
    ...,
    router: {
      mode: 'react-router-5',
    },
  },
  plugins: [..., {pluginName}()],
});

After add code, you will use React Router v5 in your project, please use React Router v5 API from '@modern-js/runtime/router-v5'.
  `,
};
