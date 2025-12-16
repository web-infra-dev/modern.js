# Other Important Changes

This document introduces other important incompatible changes and related migration instructions when upgrading from Modern.js 2.0 to 3.0.

## No Longer Support webpack Build

Modern.js 3.0 no longer supports using webpack as the build tool, and uses Rspack as the default build bundler. Rspack is implemented in Rust, providing significantly improved build speed compared to webpack, while maintaining high compatibility with webpack configuration, allowing most configurations to be migrated directly.

If your project previously used webpack-specific configurations or plugins, you need to check if there are any webpack-related custom configurations in the project and confirm whether the webpack plugins you use have corresponding Rspack versions.

:::tip
Rspack is highly compatible with webpack configuration, and in most cases, no modifications are needed.
:::

## Entry Name Changes

Modern.js 3.0 changed the default entry name to `index`, and the default built HTML file is `index.html`. `index.html` is the default homepage file for most web servers and requires no additional configuration.

If your project deployment configuration specifies a particular entry file name, you need to update it to `index.html`.

## Alias Changes

Modern.js 3.0 has adjusted some runtime path aliases, and you need to update the related import paths. The path mapping is as follows:

| Old Path | New Path | Description |
|---------|---------|-------------|
| `@modern-js/runtime/bff` | `@modern-js/plugin-bff/runtime` | BFF runtime path |
| `@modern-js/runtime/server` | `@modern-js/server-runtime` | Server runtime path |

## No Longer Support pages Directory Convention Routing

Modern.js 3.0 no longer supports the `pages` directory convention routing introduced in Modern.js 1.0, and now uniformly uses the `routes` directory convention routing.

If your project uses the `pages` directory, you need to rename the `src/pages` directory to `src/routes` and update all import paths in the project that reference the `pages` directory. For detailed migration steps, please refer to the [Convention Routing documentation](/guides/basic-features/routes/routes).

## Using React Router v7

Modern.js 3.0 uses React Router v7 as the default routing library. React Router v7 has only a few [incompatible changes](https://reactrouter.com/upgrading/v6) compared to v6.

If you need to use React Router v5 or React Router v6, you need to use the **self-controlled routing** mode. Self-controlled routing allows you to fully control the routing configuration without being limited by Modern.js convention routing.

## Creating Monorepo and Modern.js Module with @modern-js/create

Modern.js 3.0 no longer supports creating Monorepo projects and Modern.js Module projects through `@modern-js/create`.

**Changes**:

- In [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0), the functionality to create Monorepo projects using `@modern-js/create` was removed
- In [v2.61.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.61.0), the functionality to create Modern.js Module projects using `@modern-js/create` and `modern new` commands was removed

**Handling**:

- **Monorepo Projects**: The Monorepo solution previously provided by Modern.js was based on [pnpm Workspace](https://pnpm.io/workspaces) and did not provide substantial Monorepo management capabilities. It is recommended to directly use community-provided Monorepo solutions such as [Turborepo](https://turbo.build/), [Nx](https://nx.dev/), etc.
- **Modern.js Module Projects**: It is recommended to use [Rslib](https://rslib.rs/) to create and manage JavaScript library and UI component projects. Rslib is a library development tool based on Rsbuild, providing a simple and intuitive way to create JavaScript libraries. For detailed usage, please refer to the [Rslib official documentation](https://rslib.rs/).

## Removal of new and upgrade Commands

Modern.js 3.0 has removed the `modern new` and `modern upgrade` commands, and operations need to be performed manually according to the documentation.

**Changes**:

- The `modern new` command is no longer supported in Modern.js 3.0, and cannot be used to add entries or enable features through commands
- The `modern upgrade` command is no longer supported in Modern.js 3.0, and cannot be used to automatically upgrade dependencies through commands

**Handling**:

- **Adding Entries**: You need to manually create entry directories and files according to the documentation. For detailed steps, please refer to the [Page Entry documentation](/guides/concept/entries).
- **Enabling Features**: You need to manually install dependencies and configure according to the documentation for the corresponding features. For example, to enable BFF functionality, you need to install the `@modern-js/plugin-bff` plugin and configure it in `modern.config.ts`.
- **Upgrading Dependencies**: You need to manually update the versions of all `@modern-js/**` packages in `package.json`, then reinstall dependencies. For detailed steps, please refer to the [Version Upgrade documentation](/guides/get-started/upgrade).

:::info Note
The purpose of removing these commands is to make the documentation more aligned with AI Agent's default implementation approach, not to encapsulate operations, so that developers can more clearly understand the specific steps of each operation, and it is also convenient for AI Agent to directly execute corresponding operations according to the documentation.
:::

## ESLint Rule Sets

Modern.js previously provided complete ESLint rule sets, covering @modern-js (Lint rules for Node.js projects) and @modern-js-app (Lint rules for frontend projects). In [v2.60.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.60.0), we officially removed these rule sets. We encourage developers to choose appropriate code specification tools according to their needs, directly use ESLint combined with community-recommended rules, or use Biome to improve code formatting performance.

