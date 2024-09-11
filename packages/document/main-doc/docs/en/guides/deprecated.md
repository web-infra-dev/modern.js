---
sidebar_position: 10
---

# Deprecated

This article will introduce the functions that were previously supported by Modern.js, but have now been deprecated, along with the recommended alternatives.

## Creating a Monorepo using @modern-js/create

The Monorepo solution previously provided by Modern.js was implemented based on [pnpm Workspace](https://pnpm.io/workspaces) and did not offer substantial Monorepo management capabilities. In version [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0), the functionality to create Monorepo projects using `@modern-js/create` has been removed. It is recommended to directly use the Monorepo solutions provided by the community.

## Enabling the test capability with the new command

The test capability previously provided by Modern.js was a simple wrapper based on Jest, which led to issues such as unintuitive Jest configuration and more complex user configuration. In version [v2.53.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.53.0), the option to enable the test feature in application and module projects has been removed. It is recommended to directly use the testing solutions provided by the community.

Previously, Modern.js provided a comprehensive set of ESLint rules, including @modern-js (for Node.js project linting rules) and @modern-js-app (for frontend project linting rules). In version [v2.60.0](https://github.com/web-infra-dev/modern.js/releases/tag/v2.60.0), we officially removed these rule sets. We encourage developers to choose appropriate code standard tools based on their needs, either by directly using ESLint with community-recommended rules or by using Biome to enhance code formatting performance.
