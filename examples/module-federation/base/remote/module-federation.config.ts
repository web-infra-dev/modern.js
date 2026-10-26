import { createModuleFederationConfig } from '@module-federation/enhanced';

export default createModuleFederationConfig({
  name: 'remote',
  dts: { generateTypes: { typesFolder: 'static/@mf-types' } },
  manifest: {
    filePath: 'static',
    additionalData({ stats }) {
      stats.metaData.types.zip = 'static/@mf-types.zip';
      stats.metaData.types.api = 'static/@mf-types.d.ts';
    },
  },
  filename: 'static/remoteEntry.js',
  exposes: {
    './Button': './src/components/Button.tsx',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});
