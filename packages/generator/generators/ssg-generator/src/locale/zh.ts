export const ZH_LOCALE = {
  successJS: `安装插件依赖成功！请添加如下代码至 {configFile} 中:

import {pluginName} from '{pluginDependence}';

module.exports = {
  ...,
  output: {
    ...,
    ssg: true,
  },
  plugins: [..., {pluginName}()],
};
`,
  successTs: `安装插件依赖成功！请添加如下代码至 {configFile} 中:

import {pluginName} from '{pluginDependence}';

export default defineConfig({
  ...,
  output: {
    ...,
    ssg: true,
  },
  plugins: [..., {pluginName}()],
});
`,
};
