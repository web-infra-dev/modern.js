import { createModuleFederationConfig } from '@module-federation/modern-js';

export default createModuleFederationConfig({
  name: 'rsc_ssr_remote',
  manifest: {
    filePath: 'static',
  },
  filename: 'static/remoteEntry.js',
  exposes: {
    './Counter': './src/server-component-root/components/Counter.tsx',
    './DynamicMessage':
      './src/server-component-root/components/DynamicMessage.tsx',
    './ServerState': './src/server-component-root/components/ServerState.ts',
    './ServerApp': './src/server-component-root/App.tsx',
    './ClientApp': './src/client-component-root/App.tsx',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'server-only': { singleton: true },
    'client-only': { singleton: true },
  },
});
