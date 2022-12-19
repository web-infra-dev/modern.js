# Plugins

本章介绍注册 module-tools 插件的配置。

## `plugins`

类型：`Array<ModuleToolsPlugin>`

``` ts
import { ExamplePlugin } from './plugins/example';
export default defineConfig({
  plugins: [ExamplePlugin()],
});
```

关于如何编写插件，可以查看[【插件编写指南】](/zh/plugins/guide/getting-started)。
