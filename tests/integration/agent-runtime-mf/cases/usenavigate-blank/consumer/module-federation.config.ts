import { createModuleFederationConfig } from '@module-federation/modern-js-v3';

export default createModuleFederationConfig({
  name: 'useNavigateBlankConsumer',
  remotes: {
    useNavigateBlankProvider:
      'useNavigateBlankProvider@http://localhost:4361/mf-manifest.json',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
  },
});

