# @modern-js/plugin-module-babel

@modern-js/module-tools\`s plugin. You can add babel compile by the plugin before module-tools internal building.

## Usage

``` ts
import { defineConfig } from '@modern-js/module-tools';
import { ModulePluginBabel } from '@modern-js/plugin-module-main-fields';
export default defineConfig({
  plugins: [ModulePluginBabel({
    internalPresetOptions: {
      // babel-plugin-import options
      import: {},
      // @babel/preset-react options
      react: {},
    },
    // refer: https://babeljs.io/docs/en/options
    babelTransformOptions: {},
  })],
});
```


## Contributing

- [Contributing Guide](https://github.com/modern-js-dev/modern.js/blob/main/CONTRIBUTING.md)
