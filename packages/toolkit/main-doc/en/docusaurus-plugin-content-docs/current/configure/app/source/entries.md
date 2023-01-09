---
title: source.entries
sidebar_label: entries
---

- Type: `Object = { [ entryName: string ]: string | Object }`
- Default: Default entry object dynamically settled according to the current project directory structure.

For most scenarios, Modern.js automatically generated entries according to the directory structure can meet most business requirements. For details, please refer to [Entries](/docs/guides/concept/entries)。

If you need to customize the build entry, you can specify it with this option.

## String

When the value is of type `string`, the file path of the entry:

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    entries: {
      // Specify a new entry named entry_customize
      entry_customize: './src/home/test/index.js',
    },
  },
});
```

By default, the configured entry is equivalent to `App.[jt]sx`, that is, the specified entry file only needs to export the root component of the application.

For example the following directory structure:

```bash
.
├── src
│   └── entry
│       ├── chat.tsx
│       └── home.tsx
└── package.json
```

With the content of the above default entry mechanism, Modern.js when analyzing the above directory, will not get any default entry.

In cases where you do not want to change the directory structure (such as project migration), you can customize the entry through `source.entries`:

```ts title="modern.config.js"
export default defineConfig({
  source: {
    entries: {
      home: './src/entry/home.tsx',
      chat: './src/entry/chat.tsx',
    },
  },
});
```

## Object

When the value is `Object`, the following properties can be configured:

- `entry`：`string`，entry file path。
- `disableMount`：`boolean = false`，turn off Modern.js generate entry code。

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
      },
    },
  },
});
```

By default, the configured entry is equivalent to `App.[jt]sx`. If you want the entry to be equivalent to the entry in build mode, you can set the value to'Object' and the property `disableMount` to `true`.

## Combine Entry

When `source.entries` is specified, the Modern.js merges the user-defined entry with the default entry obtained by analyzing the directory structure. The merging rule is:

Compare the entry path set by the custom entry with the default entry path. When the entry paths are the same, the custom entry will override the default entry.

For example the following directory structure:

```bash
.
├── src
│   ├── chat
│   │   └── App.jsx
│   └── home
│       └── index.js
└── package.json
```

Modern.js analyze the `src/` directory to get the default entries `chat` and `home`. When the user configures the following in the `modern.config.js` file:

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    entries: {
      index: './src/home/index.js',
    },
  },
};
```

You can see that the path of the custom entry `index` is the same as the path of the default entry `home`. During the merging process, `index` will override `home`, and the final entry is as follows:

- `chat -> ./src/chat/App.jsx`
- `index -> ./src/home/index.js`
