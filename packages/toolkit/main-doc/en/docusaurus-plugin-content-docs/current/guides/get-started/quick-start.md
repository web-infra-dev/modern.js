---
title: Quick Start
sidebar_position: 1
---

## Environment

### Node.js

Requires [Node.js LTS](https://github.com/nodejs/Release) and ensures that the Node version is greater than or equal to 14.19.0, 16.x version is recommended.

Modern.js recommend installing [nvm](https://github.com/nvm-sh/nvm#install--update-script) in the development environment and integrating [script to automatically switch node versions](https://github.com/nvm-sh/nvm#deeper-shell-integration) in the shell.

Then there is a `.nvmrc` file with the content of `lts/fermium` or `lts/gallium` in the root directory of the repository, it will automatically install or switch to the correct Node.js version when entering the repository.

### pnpm

[pnpm](https://pnpm.io/installation) is recommended for package management.

```bash
npm install -g pnpm
```

:::note
Modern.js also supports package management with `yarn` and `npm`.
:::

## Install

Modern.js provides the `@modern-js/create` tool to create projects. Don't install globally, use `npx` to run on demand.

Projects can be created using an existing empty directory:

```bash
mkdir myapp && cd myapp
npx @modern-js/create
```

Projects can also be created directly from the new directory:

```bash
npx @modern-js/create myapp
```

## Initialize

Modern.js generator will provide an interactive Q & A interface, initialization items according to the result, according to the default selection:

```bash
? Please select the solution you want to create: MWA Solution
? Development Language: TS
? Package Management Tool: pnpm
```

After create the project, Modern.js automatically installs dependency and creates a git repository.

```bash
[INFO] dependencies are automatically installed
[INFO] git repository has been automatically created
[INFO] Success！
You can run the following command in the directory of the new project：
pnpm run dev          # Run and debug the project according to the requirements of the development environment
pnpm run build        # Build the project according to the requirements of the product environment
pnpm run start        # Run the project according to the requirements of the product environment
pnpm run lint         # Check and fix all codes
pnpm run new          # Create more project elements, such as application portals
```

:::note
In addition to working during project initialization, the Modern.js generator can also generate modules of the project in subsequent development, which is not thrown away as soon as it is used.
:::

Now, the project structure is as follows:

```
.
├── node_modules
├── src
│   ├── modern-app-env.d.ts
│   └── routes
│       ├── index.css
│       ├── layout.tsx
│       └── page.tsx
├── modern.config.ts
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

## Development

Execute `pnpm run dev` in the project to start the project:

```bash
$ pnpm run dev

> modern dev

info    Starting dev server...
info    App running at:

  > Local:    http://localhost:8080/
  > Network:  http://10.94.58.87:8080/
  > Network:  http://10.254.68.105:8080/

 Client ✔ done in 76.10ms
```

Open `http://localhost:8000/` in your browser and you will see the following:

![dev](https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/dev.png)

## Configuration

The `modern.config.ts` files exist in Modern.js projects created by the generator.

Features can be enabled through the configuration file, or the default behavior of the coverage Modern.js. For example, add the following configuration to enable SSR:

```ts
import { defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/docs/apis/app/config
export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  server: {
    ssr: true,
  },
});
```

Re-execute `pnpm run dev`, in the browser Network menu, you can find that the project has completed page rendering at the server level.

## Build

Execute `pnpm run build` in the project to build the project production environment product:

```bash
$ pnpm run build

> modern build

info    Create a production build...

info    File sizes after production build:

  File                                      Size         Gzipped
  dist/static/js/lib-corejs.ffeb7fb8.js     214.96 kB    67.23 kB
  dist/static/js/lib-react.09721b5c.js      152.61 kB    49.02 kB
  dist/static/js/218.102e2f39.js            85.45 kB     28.5 kB
  dist/static/js/lib-babel.a7bba875.js      11.93 kB     3.95 kB
  dist/html/main/index.html                 5.84 kB      2.57 kB
  dist/static/js/main.3568a38e.js           3.57 kB      1.44 kB
  dist/static/css/async/304.c3c481a5.css    2.62 kB      874 B
  dist/asset-manifest.json                  1.48 kB      349 B
  dist/static/js/async/304.c45706bc.js      1.4 kB       575 B
  dist/static/js/async/509.fcb06e14.js      283 B        230 B

 Client ✔ done in 3.57s
 ```

The bundle is generated to `dist/` by default, and the directory structure is as follows:

```
.
├── asset-manifest.json
├── html
│   └── main
├── loader-routes
│   └── main
├── modern.config.json
├── route.json
└── static
    ├── css
    └── js
```

## Verify

Execute `pnpm run start` in the project to verify locally that the bundle is running correctly:

```bash
$ pnpm run start

> modern start

Starting the modern server...
info    App running at:

  > Local:    http://localhost:8080/
  > Network:  http://10.94.58.87:8080/
  > Network:  http://10.254.68.105:8080/
```

Open http://localhost:8000/ in the browser and the content should be the same as when `pnpm run dev`.

## Deploy

After the local verification is completed, the products under `dist/` can be organized into the structure required by the server for deployment.
