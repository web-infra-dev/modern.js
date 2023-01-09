---
title: source.disableEntryDirs

sidebar_label: disableEntryDirs
---

- Type： `string[]`
- Default： `[]`

By default, application entries are identified based on the'src 'directory, you can disable some directories from being identified as application entries with this option.

For example, when the configuration and directory structure is as follows：

```ts title="modern.config.ts"
export default defineConfig({
  source: {
    disableEntryDirs: './src/one',
  },
});
```

```bash title="Project directory structure"
└── src/
    ├── one/
    |    └── App.tsx
    ├── two/
    |    └── routes/
    └── env.d.ts
```

When this option is not set, Modern.js will generate two entries based on the project directory:

- one
- two

When this option is set, `src/one` will not be recognized as an entry directory.

A common usage is to configure the `src/common`, `src/components` directories to this option to avoid these directories being recognized as application entries.
