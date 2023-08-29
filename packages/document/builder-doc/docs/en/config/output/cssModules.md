- **Type:**

```ts
type CssModuleLocalsConvention =
  | 'asIs'
  | 'camelCase'
  | 'camelCaseOnly'
  | 'dashes'
  | 'dashesOnly';

type CssModules = {
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);
  exportLocalsConvention?: CssModuleLocalsConvention;
};
```

- **Default:**

```ts
const defaultCssModules = {
  exportLocalsConvention: 'camelCase',
};
```

Setup css modules configuration.

### cssModules.auto

The `auto` configuration option allows CSS modules to be automatically enabled based on their filenames.

- **Type:** `boolean | RegExp | ((resourcePath: string) => boolean)`

- **Default:** `undefined`

Type description:

- `undefined`: According to the [output.disableCssModuleExtension](https://modernjs.dev/builder/en/api/config-output.html#outputdisablecssmoduleextension) configuration option to determine which style files to enable CSS modules.
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

### cssModules.exportLocalsConvention

Style of exported class names.

- **Type:** `'asIs' | 'camelCase' | 'camelCaseOnly' | 'dashes' | 'dashesOnly'`

- **Default:** `'camelCase'`

Type description:

- `asIs` Class names will be exported as is.
- `camelCase` Class names will be camelized, the original class name will not to be removed from the locals.
- `camelCaseOnly` Class names will be camelized, the original class name will be removed from the locals.
- `dashes` Only dashes in class names will be camelized.
- `dashesOnly` Dashes in class names will be camelized, the original class name will be removed from the locals.

```ts
export default {
  output: {
    cssModules: {
      exportLocalsConvention: 'camelCaseOnly',
    },
  },
};
```
