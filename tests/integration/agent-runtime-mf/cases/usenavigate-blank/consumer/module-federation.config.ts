import { createModuleFederationConfig } from '@module-federation/modern-js-v3';
import { dependencies } from './package.json';

export default createModuleFederationConfig({
  name: 'useNavigateBlankConsumer',
  remotes: {
    useNavigateBlankProvider:
      'useNavigateBlankProvider@http://localhost:4361/mf-manifest.json',
  },
  shared: {
    react: { singleton: true, requiredVersion: dependencies.react },
    'react-dom': {
      singleton: true,
      requiredVersion: dependencies['react-dom'],
    },
  },
});
