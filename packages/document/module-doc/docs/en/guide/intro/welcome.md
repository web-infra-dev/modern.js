---
sidebar_position: 1
---

# Welcome to Modern.js Module

Modern.js Module is a modules engineering solution for Modern.js, as well as a core dependency. It allows developers to build, debug, and publish module type project more easily. A module type project can mostly be thought of as an npm package type project, which may be a component, component library or tool library project.

If you are planning to develop a project of the npm package type, then you came to the right place! Modern.js provides a professional Modern.js Module. It gives you:

- **Simple project initialization**: simply execute the `npx @modern-js/create project-dir` command, followed by a few interactive questions, to create a complete module type project. The created project also supports the choice of two package managers, [**pnpm**](https://pnpm.io/) and [**Yarn**](https://classic.yarnpkg.com/).
- **Code formatting**: In Modern.js Module, you can execute `modern lint` to format the code. The initialized module project includes the [ESLint](https://eslint.org/docs/latest/user-guide/core-concepts#what-is-eslint) ruleset for Modern.js for most scenarios.
- **Comprehensive build capabilities and faster builds**: Modern.js Module provides high-performance build capabilities based on [esbuild](https://esbuild.github.io/getting-started/) and [SWC](https://swc.rs/), and provides rich configurations for different build scenarios.
- **Storybook debugging tools**: Modern.js Module provides [Storybook](https://storybook.js.org/) debugging tools for debugging module projects. After installing the Storybook plugin for Modern.js Module, you can start it with the `storybook dev` command. You can use Storybook not only for debugging components, but also for other types of modules.
- **Versioning based on Changesets**: When you need to record changes to a project, you can use the `modern change` command to generate a Markdown file containing the changes; when you need to upgrade a project, you can use the `modern bump` command to analyze and upgrade the version through the Markdown file; when you need to release a project, you can use the `modern release` command to release the project; Modern.js Module implements these commands based on [Changesets](https://github.com/changesets/changesets).
- **Extensible plugin mechanism**: Want to integrate additional debugging tools for your project? Or maybe you want to do some extra processing during the build process, Modern.js Module provides a plugin mechanism and plugin hooks that cover both the `dev` command and the `build` command process. You can use them to extend the capabilities of your project.
- **Lots more!** Modern.js Module will continue to optimize its build and debug features in the future. If there are important issues to be solved in module project building, or if a mainstream module project debugging tool or pattern emerges, then they will probably be supported by Modern.js Module.
