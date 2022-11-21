# @modern-js/plugin-module-main-fields

@modern-js/module-tools\`s plugin. You can set [mainFields](https://esbuild.github.io/api/#target) extended module-tools\`s default behavior by the plugin.

## Usage

``` ts
import { defineConfig } from '@modern-js/module-tools';
import { ModuleMainFieldsPlugin } from '@modern-js/plugin-module-main-fields';
export default defineConfig({
  plugins: [ModuleMainFieldsPlugin({
    mainFields: ['module', 'main', 'jsnext'],
  })],
});
```


## Contributing

- [Contributing Guide](https://github.com/modern-js-dev/modern.js/blob/main/CONTRIBUTING.md)
