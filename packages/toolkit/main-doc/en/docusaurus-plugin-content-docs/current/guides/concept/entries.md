---
title: Entries
sidebar_position: 2
---

Entries are Modern.js default file convention, and each entry in the project is a separate page, corresponding to a server level route.

Many configurations, such as HTML templates, Meta information, whether SSR is enabled, SSG, server level routing rules are divided by the entry dimension.

## Single Entry and Multiple Entries

Modern.js initialization project is a single entry, the project structure is as follows:

```
.
├── src
│   ├── modern-app-env.d.ts
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
├── package.json
├── modern.config.ts
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

Modern.js can easily switch from single entry to multiple entry. You can execute `pnpm run new` under the project to create entry through generator:

```bash
? Action: Create project element
? Create project element: New "entry"
? Entry name: new-entry
```

After execution, the `src/` directory will become the following structure:

```
.
├── modern-app-env.d.ts
├── myapp
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
└── new-entry
    └── routes
        ├── index.css
        ├── layout.tsx
        └── page.tsx
```

The original code was moved to the directory with the same name as the `name` in the `package.json`, and a new directory was created.

After executing `pnpm run dev`, you can see that a `/new-entry` route has been added, and the migrated code route has not changed.

:::note
Modern.js will use the directory with the same name as the `name` in the `package.json` as the main entry, the default route is `/`, and the default route for other entries is `/{entryName}`.
:::

## Entry conditions

By default, the Modern.js entry currently scans the file under `src/`, identifies the entry, and generates the corresponding server level route.

:::tip
You can change the entry directory to another directory by [source.entriesDir](/docs/configure/app/source/entries-dir).
:::

Not all first-level directories under `src/` will become project entrances. The directory where the entry is located must meet one of the following four conditions:


1. Directory with `routes/`
2. Has the `App.[jt]sx?` file
3. With `index.[jt]sx?` file
2. With `pages/` directory (compatible Modern.js 1.0)

When the `src/` directory satisfies the entry feature, the Modern.js considers the current project to be a single entry application.

:::tip
Single entry The default entry name is `main`.
:::

When the project is not a single-entry application, Modern.js further look at the first-level directory under `src/`.

## Difference between entries

Entries to different conventions have different behaviors.

### routes

If the entry is the `routes/` convention, Modern.js will scan the files under `routes` at startup, and automatically generate the client route based on the file convention(react-router).

For details, please refer to [Routing](/docs/guides/basic-features/routes).

### App

If the entry is the `App.[jt]sx?` convention, the developer can freely set the client route in this file, or not set the client route.

For details, please refer to [Routing](/docs/guides/basic-features/routes).

### Index

Typically, the above two modes are sufficient, but when developers need to take over the React mount logic themselves, or take over the Webpack entry entirely, the `index.[jt]sx?`convention can be used.

If the entry is the `index.[jt]sx?` convention, the Modern.js determines the build behavior based on whether the file has a default component export.

For details, please refer to [customized App](/docs/guides/advanced-features/custom-app).

## configuration

In Modern.js, you can manually configure the entry in `modern.config.[jt]s`, in addition to using the file convention to generate the entry.

:::tip
Details can be found in [source.entries](/docs/configure/app/source/entries).
:::
