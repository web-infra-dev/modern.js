---
sidebar_position: 1
---

# Why do you need a generator plugin

Modern.js provides application (MWA), modules and Monorepo three engineering solutions, and by using the `@modern-js/create` tool can create the initial project template of the three engineering solutions, the initial project template will provide basic code development environment, simple sample code and configuration, etc.

Modern.js provides an initialization template that is versatile and can meet some general project development needs.

When you use Modern.js in depth, you will inevitably find that every time you create a project, you will make some similar changes specific to your own project, such as modifying the sample code, adding some configuration, enabling some functions, etc.


The generator plugin can help you precipitate these individual or team-specific changes. Simply bring the `--plugin` parameter when executing `npx @modern-js/create` to avoid the need to repeatedly modify the project every time the project is created..

The generator plugin is based on the initialization template project provided by the Modern.js, providing methods to add, delete and modify templates, and modifying `package.json`, `modernConfig` configuration and opening functions in a fast way.

The generator plugin provides two ways of customization:

1. Extended engineering: directly customize the three major engineering provided by default.


2. Create engineering scenes: Create corresponding engineering scenes based on the default three major engineering.


The next step will introduce how to use and develop the generator plugin step by step.
