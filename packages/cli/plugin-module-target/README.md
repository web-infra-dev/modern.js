# @modern-js/plugin-module-target

@modern-js/module-tools\`s plugin. You can set [target](https://esbuild.github.io/api/#target) instead of module-tools\`s [`target`](TODO) api by the plugin.

**Note: It may not work correctly**

## Usage

``` ts
import { defineConfig } from '@modern-js/module-tools';
import { ModuleTargetPlugin } from '@modern-js/plugin-module-target';
export default defineConfig({
  plugins: [ModuleTargetPlugin({
    target: [
      'es2020',
      'chrome58',
      'edge16',
      'firefox57',
      'node12',
      'safari11',
    ]
  })],
});
```


## Contributing

- [Contributing Guide](https://github.com/modern-js-dev/modern.js/blob/main/CONTRIBUTING.md)
