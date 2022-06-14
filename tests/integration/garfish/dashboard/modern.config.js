import { defineConfig } from '@modern-js/app-tools';
import { getPort } from '../../../utils/testCase';

module.exports = defineConfig({
  runtime: {
    router: {},
    // state: true,
  },
  deploy: {
    microFrontend: {
      enableHtmlEntry: true,
      externalBasicLibrary: false,
    },
  },
  server: {
    port: getPort('@cypress-test/garfish-dashboard'),
  },
  tools: {
    // devServer: {
    //   headers: {
    //     'Access-Control-Allow-Origin': '*',
    //   },
    // },
    // webpack: () => ({
    //   devServer: {
    //     // 保证在开发模式下应用端口不一样
    //     port: '8000',
    //     headers: {
    //       // 保证子应用的资源支持跨域，在上线后需要保证子应用的资源在主应用的环境中加载不会存在跨域问题（**也需要限制范围注意安全问题**）
    //       'Access-Control-Allow-Origin': '*',
    //     },
    //   },
    // }),
  },
  // dev: {
  //   withMasterApp: {
  //     moduleApp: 'http://localhost:8080/',
  //     moduleName: 'Dashboard',
  //   },
  // },
});
