# Modern.js Contributing Guide

Thanks for that you are interested in contributing to Modern.js.

## Setting Up Your Local Dev Environment

### Fork Your Own Repo
[Fork](https://help.github.com/articles/fork-a-repo/) this repository to your
own GitHub account and then
[clone](https://help.github.com/articles/cloning-a-repository/) it to your
local.

### Install pnpm

```zsh
npm install -g pnpm@6
```

### Set up local Modern.js repository

```zsh
pnpm install --ignore-scripts
pnpm prepare
```

<details>
   <summary>
   what this will achieve
   </summary>

- install all dependencies
- create symlinks between necessary packages in the monorepo
- run `prepare` script, building all packages (this will take some time, but is necessary to ensure all package dependencies are built and available)

A full rebuild of all packages is generally not needed after this. Should a new feature you are developing require an updated version of another package, building those necessary dependencies is usually enough.
</details>

### Set your email appropriately for git

Make sure you have your email set up in <https://github.com/settings/emails>. This will be required later if you wish to submit a pull request.

check if your git client is already configured:

```zsh
git config --list | grep email
```

for global settings:

```zsh
git config --global user.email "SOME_EMAIL@example.com"
```

only for this repo:

```zsh
git config user.email "SOME_EMAIL@example.com"
```

## Making Changes and Building

Once you have your local dev environment set up with your [Fork](https://help.github.com/articles/fork-a-repo/) we can start developing.

### Checkout A New Branch

It is recommended to develop on a new branch, as it will make things easier later when you submit a pull request:

```zsh
git checkout -b MY_BRANCH_NAME
```

### Build the Package

Go into the package you wish to make changes to, and then build it:

changing working directory to package:

```zsh
cd ./packages/some_package
pnpm run build
```

or at repo root:

```zsh
pnpm run build --filter @modern-js/some_package
```

## Testing Your Changes

### Create Your Test Project

go to the `local-test-project` directory, and create your test project

```zsh
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

   ```zsh
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
         "@modern-js/plugin-jarvis": "workspace:*",
         "@modern-js/some_package": "workspace:*",
         ...
      }
   }
   ```

   [more info on pnpm workspaces](https://pnpm.io/workspaces).

### Create Symlinks

let pnpm create the necessary symlinks:

```zsh
pnpm install --ignore-scripts
```

the `-ignore-scripts` option is used to prevent building everything again

### Test Your Code

Depending on where you made your changes, you may need to run different commands

```zsh
pnpm dev
pnpm build
pnpm deploy
...
```

## Submitting Changes

Be sure that you have [set up your email](#set-your-email-appropriately-for-git) accordingly. Also make sure that you are [working on a new branch](#checkout-a-new-branch).

### Add a Changeset

Add changeset. Select changed packages in this commits and add changeset info.

```zsh
pnpm run change
```

### Committing your Changes

Commit your changes to your forked repo, and [create a pull request](https://help.github.com/articles/creating-a-pull-request/)


## Building

You can build single package, with:

```zsh
cd ./packages/*
pnpm run build
```

build all packages, with:

```zsh
pnpm run prepare
```

If you need to clean all `node_modules/*` the project for any reason, with

```zsh
pnpm run reset
```

## Testing

You need write th new tests for new feature or modify exist tests for changes.

We wish you write unit tests at `PACKAGE_DIR/tests`. Test syntax is based on [jest](https://jestjs.io/).

### Run Unit Testing

```sh
pnpm run test
```

### Run E2E Testing

1. If you want to run the e2e command, you must first execute the e2e prepare command

```sh
pnpm run prepare --filter "tests"
```

2. start test

```sh
pnpm run test:e2e
```

## Linting

To check the formatting of your code:

```zsh
pnpm run lint
```

## Publishing

We use **Modern.js Monorepo Solution** to manage version and changelog.

Repository maintainers can publish a new version of all packages to npm.

1. Fetch newest code at branch `main`.
2. Install

   ```zsh
   pnpm run setup
   ```

3. Prepare

   ```zsh
   pnpm run prepare
   ```

4. Bump version

   ```zsh
   pnpm run bump
   ```

5. Commit version change. The format of commit message should be `chore: va.b.c` which is the main version of current release.

   ```zsh
   git add .
   git commit -m "chore: va.b.c"
   ```
