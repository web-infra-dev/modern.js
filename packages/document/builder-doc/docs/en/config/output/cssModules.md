- **Type:**

```ts
type CssModules =
  | boolean
  | {
      auto?: boolean | RegExp | ((resourcePath: string) => boolean);
    };
```

- **Default:** `true`

Allows to enable/disable CSS Modules, or setup configuration.

#### Boolean Type

Enable or disable CSS modules by setting `output.cssModules` to true or false.

When CSS modules are enabled, which style files will be processed as CSS Modules modules will be determined by default according to the [output.disableCssModuleExtension](/api/config-output.html#outputdisablecssmoduleextension) configuration item.

Also, You can configure more flexible file processing rules through `output.cssModules.auto`.

#### Object Type

When the value of `output.cssModules` is object type, the CSS modules behavior will be determined according to the following configuration:

##### auto

The `auto` configuration option allows CSS modules to be automatically enabled based on their filenames.

- **Type:** `boolean | RegExp | ((resourcePath: string) => boolean)`;

- **Default:** `undefined`

Type description:

- `undefined`: According to the [output.disableCssModuleExtension](/api/config-output.html#outputdisablecssmoduleextension) configuration item to determine which style files to enable CSS modules.
- `true`: enable CSS modules for all files matching `/\.module\.\w+$/i.test(filename)` regexp.
- `false`: disables CSS Modules.
- `RegExp`: enable CSS modules for all files matching `/RegExp/i.test(filename)` regexp.
- `function`: enable CSS Modules for files based on the filename satisfying your filter function check.

```ts
export default {
  output: {
    cssModules: {
      auto: resource => {
        return resource.includes('.module.') || resource.includes('shared/');
      },
    },
  },
};
```
