import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'mcp_ui',
  manifest: { filePath: 'static' },
  filename: 'static/remoteEntry.js',
  dts: false,
  exposes: { './Greeting': './src/components/Greeting.tsx' },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react/jsx-runtime': { singleton: true },
    'react/jsx-dev-runtime': { singleton: true },
  },
});
