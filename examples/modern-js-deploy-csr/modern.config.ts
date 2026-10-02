import { appTools, defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  plugins: [appTools()],
  server: {
    baseUrl: '/modern-js-deploy-csr', // It should be replaced with your repository name
  },
  output: {
    minify: false,
    assetPrefix: '/modern-js-deploy-csr/', // It should be replaced with your repository name
  },
});
