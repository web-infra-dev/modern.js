import { appTools, defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/en/configure/app/usage
export default defineConfig({
  server: {
    port: 3051,
  },
  output: {
    // Now this configuration is only used in the local when you run modern serve command.
    // If you want to deploy the application to the platform, use your own domain name.
    // Module federation will automatically write it to mf-manifest.json, which influences consumer to fetch remoteEntry.js.
    assetPrefix: 'http://127.0.0.1:3051',
  },
  plugins: [appTools()],
});
