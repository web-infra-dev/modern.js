---
sidebar_position: 10
---

# Deprecated Functions

This article will introduce the functions that were previously supported by Modern.js, but have now been deprecated, along with the recommended alternatives.

## Creating a Monorepo using @modern-js/create

The Monorepo solution previously provided by Modern.js was implemented based on [pnpm Workspace](https://pnpm.io/workspaces) and did not offer substantial Monorepo management capabilities. In version [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0), the functionality to create Monorepo projects using `@modern-js/create` has been removed. It is recommended to directly use the Monorepo solutions provided by the community.

## Enabling the test capability with the new command

The test capability previously provided by Modern.js was a simple wrapper based on Jest, which led to issues such as unintuitive Jest configuration and more complex user configuration. In version [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0), the option to enable the test feature in application and module projects has been removed. It is recommended to directly use the testing solutions provided by the community.
