export const ZH_LOCALE = {
  success_js: `安装插件依赖成功！请添加如下代码至 {configFile} 中:

import {pluginName} from '{pluginDependence}';
import {bffPluginName} from '{bffPluginDependence}';

module.exports = {
  ...,
  plugins: [..., {pluginName}(), {bffPluginName}()],
};
`,
  success_ts: `安装插件依赖成功！请添加如下代码至 {configFile} 中:

import {pluginName} from '{pluginDependence}';
import {bffPluginName} from '{bffPluginDependence}';

export default defineConfig({
  ...,
  plugins: [..., {pluginName}(), {bffPluginName}()],
});
`,
};
