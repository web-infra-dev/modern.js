# Plugins

This chapter describes the configuration of the registered module-tools plugin.

## `plugins`

Type: `Array<ModuleToolsPlugin>`

``` ts
import { ExamplePlugin } from '. /plugins/example';
export default defineConfig({
  plugins: [ExamplePlugin()],
});
```

For more information on how to write plugins, check out the [[Plugin Writing Guide]](/en/plugins/guide/getting-started).
