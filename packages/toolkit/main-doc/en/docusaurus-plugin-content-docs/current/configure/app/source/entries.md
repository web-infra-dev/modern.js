---
title: source.entries
sidebar_label: entries
---

* Type: `Object = { [ entryName: string ]: string | Object }`
* Default: Default entry object dynamically settled according to the current project directory structure.

For most scenarios, Modern.js automatically generated entries according to the directory structure can meet most business requirements. For details, please refer to [Entries](/docs/guides/concept/entries)。

If you need to customize the build entry, you can specify it with this option.

## String

When the value is of type `string`, the file path of the entry:

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    entries: {
      // 指定一个名称为 entry_customize 的新入口
      entry_customize: './src/home/test/index.js',
    },
  },
});
```

Customized entry, only need to export `App` by default, Modern.js will generate a real entry file.

When this behavior needs to be turned off, the value can be set to `Object` and the property `disableMount` can be set to `true`.


## Object

When the value is `Object`, the following properties can be configured:

* `entry`：`string`，entry file path。
* `disableMount`：`boolean = false`，turn off Modern.js generate entry code。
* `enableFileSystemRoutes`：`boolean = false`，[Use Conventional Routing](/docs/apis/app/hooks/src/pages)。

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    entries: {
      entry_customize: {
        // entry file path
        entry: './src/home/test/App.jsx',
      },
      // Use Conventional Routing
      entry_spa: {
        // The entry path of a conventional route must be set to a directory
        entry: './src/about',
        enableFileSystemRoutes: true,
      },
    },
  },
});
```
