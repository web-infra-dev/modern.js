---
title: source.entriesDir
sidebar_label: entriesDir
---

- Type: `string`
- Default: `./src`

By default, the application entry will be identified according to the `src` directory. You can customize the identification directory of the application entry through this option.

For example, when the configuration and directory structure are as follows:

```ts title="modern.config.ts"
export default defineConfig({
  source: {
    entriesDir: './src/pages',
  },
});
```

```bash title="Project directory structure"
.
└── src
    └── pages
        ├── a
        │   └── App.jsx
        └── b
            └── App.jsx
```

Modern.js will generate the build entry `a` and entry `b` according to the `./src/pages` directory structure, the result is as follows:

```js
 {
   a: './src/pages/a/App.jsx',
   b: './src/pages/b/App.jsx'
 }
```
