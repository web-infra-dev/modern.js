- **Type:**

```ts
type CssModules = {
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);
};
```

- **Default:** `undefined`

Setup css modules configuration.

### cssModules.auto

The `auto` configuration option allows CSS modules to be automatically enabled based on their filenames.

- **Type:** `boolean | RegExp | ((resourcePath: string) => boolean)`;

- **Default:** `undefined`

Type description:

- `undefined`: According to the [output.disableCssModuleExtension](https://modernjs.dev/builder/en/api/config-output.html#outputdisablecssmoduleextension) configuration item to determine which style files to enable CSS modules.
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
