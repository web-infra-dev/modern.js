# Modern.js Contributing Guide

Thanks for that you are interested in contributing to Modern.js. Before starting your contribution, please take a moment to read the following guidelines.

## Setting Up the Local Dev Environment

### Fork Your Own Repo

[Fork](https://help.github.com/articles/fork-a-repo/) this repository to your
own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local.

### Install pnpm

```sh
# enable pnpm with corepack, only available on node >= `v14.19.0`
corepack enable

# or install pnpm directly
npm install -g pnpm@7.29.1
```

### Set up local Modern.js repository

```sh
pnpm install
```

<details>
   <summary>
   what this will achieve
   </summary>

- Install all dependencies
- Create symlinks between necessary packages in the monorepo
- Run `prepare` script, building all packages (this will take some time, but is necessary to ensure all package dependencies are built and available)

A full rebuild of all packages is generally not needed after this. Should a new feature you are developing require an updated version of another package, building those necessary dependencies is usually enough.

</details>

### Set your email appropriately for git

Make sure you have your email set up in <https://github.com/settings/emails>. This will be required later if you wish to submit a pull request.

check if your git client is already configured:

```sh
git config --list | grep email
```

for global settings:

```sh
git config --global user.email "SOME_EMAIL@example.com"
```

only for this repo:

```sh
git config user.email "SOME_EMAIL@example.com"
```

## Making Changes and Building

Once you have your local dev environment set up with your [Fork](https://help.github.com/articles/fork-a-repo/) we can start developing.

### Checkout A New Branch

It is recommended to develop on a new branch, as it will make things easier later when you submit a pull request:

```sh
git checkout -b MY_BRANCH_NAME
```

### Build the Package

To build the package you want to make changes to, first navigate to the package directory, then build the package:

```sh
# Replace some-package with the name of the package you want to work on
cd ./packages/some-package
pnpm run build
```

Alternatively, you can build the package from the root directory of the repository using the `--filter` option:

```sh
pnpm run --filter @modern-js/some-package build
```

## Testing Your Changes

### Create Your Test Project

go to the `local-test-project` directory, and create your test project

```sh
cd local-test-project
pnpm dlx @modern-js/create my-test-project
cd my-test-project
```

<details>
   <summary>
   More details on how things work
   </summary>

Subdirectories of `local-test-project` directory is ignored by `.gitignore` file, and thus we can safely use it as a playground for the code we are developing. Furthermore, the `local-test-project/pnpm-workspace.yaml` file helps pnpm symlink dependencies in our test project to the built files in the main monorepo. Here is more info on [pnpm Workspaces](https://pnpm.io/workspaces).

</details>

### Configure Your Test Project

1. remove `.npmrc` to prevent conflicts with the root

   ```sh
      rm .npmrc
   ```

2. change relative dependencies to `"workspace:*"`, for example:

   ```json
   {
      "dependencies": {
         "@modern-js/runtime": "workspace:*"
      },
      "devDependencies": {
         "@modern-js/app-tools": "workspace:*",
         "@modern-js/plugin-lint": "workspace:*",
         "@modern-js/some_package": "workspace:*",
         ...
      }
   }
   ```

   [more info on pnpm workspaces](https://pnpm.io/workspaces).

### Create Symlinks

let pnpm create the necessary symlinks:

```sh
pnpm install
```

### Test Your Code

Depending on where you made your changes, you may need to run different commands

```sh
pnpm dev
pnpm build
pnpm deploy
...
```

## Submitting Changes

Be sure that you have [set up your email](#set-your-email-appropriately-for-git) accordingly. Also make sure that you are [working on a new branch](#checkout-a-new-branch).

### Add a Changeset

Add changeset. Select changed packages in this commits and add changeset info.

```sh
pnpm run change
```

### Committing your Changes

Commit your changes to your forked repo, and [create a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Building

You can build single package, with:

```sh
cd ./packages/*
pnpm run build
```

build all packages, with:

```sh
pnpm run prepare
```

If you need to clean all `node_modules/*` the project for any reason, with:

```sh
pnpm run reset
```

## Testing

You need write th new tests for new feature or modify exist tests for changes.

We wish you write unit tests at `PACKAGE_DIR/tests`. Test syntax is based on [jest](https://jestjs.io/).

### Run Unit Testing

Before submitting a pull request, it's important to make sure that your changes haven't introduced any regressions or bugs. You can run the unit tests for the project by executing the following command:

```sh
pnpm run test
```

### Run E2E Testing

In addition to the unit tests, the project also includes end-to-end (E2E) tests that verify the functionality of the application as a whole. To run the E2E tests, you'll need to follow these steps:

1. Execute the E2E prepare command to set up the necessary environment:

```sh
pnpm run --filter "tests" prepare
```

2. Start the E2E tests:

```sh
pnpm run test:e2e
```

## Linting

To help maintain consistency and readability of the codebase, we use a ESLint to lint the codes. You can run the linter by executing the following command:

```sh
pnpm run lint
```

## Documentation

Currently Modern.js provides documentation in English and Chinese. If you can use Chinese, please update both documents at the same time. Otherwise, just update the English documentation.

You can find all the documentation in the `packages/document` folder:

```bash
root
└─ packages
   └─ document
       ├─ builder-doc    # Documentation for Modern.js Builder
       ├─ doc-tools-doc  # Documentation for Modern.js Doc
       ├─ main-doc       # Documentation for Modern.js Framework
       └─ module-doc     # Documentation for Modern.js Module
```

This website is built with [Modern.js Doc](https://modernjs.dev/doc-tools), the document content can be written using markdown or mdx syntax. You can refer to the [Modern.js Doc Website](https://modernjs.dev/doc-tools) for detailed usage.

The source code of Modern.js Doc can be found in [this folder](https://github.com/web-infra-dev/modern.js/tree/main/packages/solutions/doc-tools).

## Publishing

We use **Modern.js Monorepo Solution** to manage version and changelog.

Repository maintainers can publish a new version of all packages to npm.

1. Fetch newest code at branch `main`.
2. Install

   ```sh
   pnpm run setup
   ```

3. Prepare

   ```sh
   pnpm run prepare
   ```

4. Bump version

   ```sh
   pnpm run bump
   ```

5. Commit version change. The format of commit message should be `chore: va.b.c` which is the main version of current release.

   ```sh
   git add .
   git commit -m "chore: va.b.c"
   ```
