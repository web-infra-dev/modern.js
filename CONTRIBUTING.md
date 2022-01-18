# Modern.js Contributing Guide

Thanks for that you are interested in contributing to Modern.js.

## Developing

To develop locally:

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your
   own GitHub account and then
   [clone](https://help.github.com/articles/cloning-a-repository/) it to your
   local.
2. Create a new branch:

   ```zsh
   git checkout -b MY_BRANCH_NAME
   ```

3. Install pnpm

   ```zsh
   npm install -g pnpm
   ```

4. Install the dependencies

   ```zsh
   pnpm run setup
   ```

5. Build the eslint-config packages

   ```zsh
   pnpm run build --filter @modern-js/eslint-config...
   ```

6. Go into package which you want to contribute.

   ```zsh
   cd ./packages/
   ```

7. Start developing.

8. Add changeset. Select changed packages in this commits and add changeset info.

   ```zsh
   pnpm run change
   ```

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

### Run Testing

```sh
pnpm run test
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
