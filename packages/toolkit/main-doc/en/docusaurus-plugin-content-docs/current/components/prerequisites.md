### Node.js

Requires [Node.js LTS] (https://github.com/nodejs/Release) and makes sure the Node version is greater than or equal to v16.18.1.

Modern.js recommend installing [nvm](https://github.com/nvm-sh/nvm#install--update-script) in the development environment and integrating [script to automatically switch node versions](https://github.com/nvm-sh/nvm#deeper-shell-integration) in the shell.

Then whenever there is a `.nvmrc` file with `lts/gallium` in the root directory of the repository, entering the repository will automatically install or switch to the correct Node.js version.

### pnpm

It is recommended to use [pnpm](https://pnpm.io/installation) to manage dependencies:

```bash
npm install -g pnpm
```

:::note
Modern.js also supports dependency management with `yarn` and `npm`.
:::
