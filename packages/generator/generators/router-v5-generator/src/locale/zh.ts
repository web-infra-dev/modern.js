export const ZH_LOCALE = {
  success_js: `安装插件依赖成功！请添加如下代码至 {configFile} 中:
import {pluginName} from '{pluginDependence}'

module.exports = {
  ...,
  runtime: {
    ...,
    router: {
      mode: 'react-router-5'
    }
  },
  plugins: [{pluginName}()]
};
添加完成后，你将在当前项目中使用 React Router v5，请使用 React Router v5 相关 API 并从 '@modern-js/runtime/router-v5' 导入。
`,
  success_ts: `安装插件依赖成功！请添加如下代码至 {configFile} 中:
import {pluginName} from '{pluginDependence}'

export default defineConfig({
  ...,
  runtime: {
    ...,
    router: {
      mode: 'react-router-5'
    }
  },
  plugins: [{pluginName}()]
});
添加完成后，你将在当前项目中使用 React Router v5，请使用 React Router v5 相关 API 并从 '@modern-js/runtime/router-v5' 导入。
`,
};
