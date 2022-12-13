---
title: Upgrade
sidebar_position: 2
---

## Upgrade with command

Modern.js provides the `upgrade` command to support projects to upgrade to the latest  version.

Execute `pnpm run upgrade` in the project:

```bash
$ pnpm run upgrade

> modern upgrade

[INFO] [Project Type]: Application
[INFO] [Modern.js Latest Version]: 2.0.0
[INFO] Upgrade Modern.js package version success!
```

You can see that the dependency in the project `package.json` has been changed to the latest.

## Specify version upgrade

Modern.js all packages are published using the **unified version number**.

According to the website Release Note, developers can also manually upgrade the project to the desired version.

:::tip
When upgrading, you need to upgrade to all packages provided by the Modern.js, rather than upgrading a single dependency.
:::

## lock child dependency

When there is a problem with one of the child dependencies of the project, and the Modern.js cannot be updated immediately, you can use the package manager to lock the child dependency version.

### pnpm

For projects using pnpm, add the following configuration to the `package.json` in the **project root directory** and re-execute `pnpm install`:

```json
{
  "pnpm": {
    "overrides": {
      "package-name": "^1.0.0"
    }
  }
}
```

### Yarn

For projects using Yarn, add the following configuration to the `package.json` in the **project root directory** and re-execute `yarn install`:

```json
{
  "resolutions": {
    "package-name": "^1.0.0"
  }
}
```

### Npm

For projects using Npm, add the following configuration to the `package.json` in the **project root directory** and re-execute `npm install`:

```json
{
  "overrides": {
    "package-name": "^1.0.0"
  }
}
```

:::info
For Monorepo repositories, the dependency version can only be locked in the `package.json` in the project root directory, and all packages in Monorepo are affected.
:::
