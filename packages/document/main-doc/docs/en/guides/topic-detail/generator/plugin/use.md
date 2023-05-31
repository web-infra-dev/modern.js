---
sidebar_position: 3
---

# Usage

`@modern-js/create` provides the `--plugin` parameter to run the generator plugin project.

`--plugin` supports three formats:

## Absolute path

Suitable for local development and debugging. After development is completed, build the project by running `npm run build` in the generator plugin project, and then use the following command for testing:

```bash
npx @modern-js/create@latest --plugin <pluginPath>
```

## Relative path

Suitable for local development and debugging or when the generator plugin project and the target project to be created are in the same Monorepo and there is no need to publish an NPM package. After building the generator plugin project, use the following command:

```bash
npx @modern-js/create@latest --plugin file:../<pluginPath>
```

## NPM package

Suitable for scenarios where the generator project is published on bnpm for sharing.

```bash
npx @modern-js/create@latest --plugin <pluginPackage>
```
