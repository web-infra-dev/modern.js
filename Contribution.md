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

3. Install pnpm:

    ```zsh
    npm install -g pnpm
    ```

4. Install the dependencies with:

    ```zsh
    pnpm run setup
    ```

5. Go into package which you want to contribute.

    ```zsh
    cd ./packages/
    ```

6. Start developing and watch for code changes:

   ```zsh
   pnpm dev
   ```

## Building

You can build single package, with:

```zsh
cd ./packages/*
pnpm build
```

build all packages, with:

```zsh
pnpm prepare
```

If you need to clean all `node_modules/*` the project for any reason, with

```zsh
pnpm reset
```

## Testing

You need write th new tests for new feature or modify exist tests for changes.

We wish you write unit tests at `PACKAGE_DIR/tests`. Test syntax is based on [jest](https://jestjs.io/).

### Run Testing

```sh
pnpm test
```

## Linting

To check the formatting of your code:

```zsh
pnpm lint
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
    pnpm prepare
    ```

4. Add changeset

   ```zsh
   pnpm change
   ```

5. Bump version

   ```zsh
   pnpm bump
   ```

6. Commit version change. The format of commit message should be `chore: va.b.c` which is the main version of current release.

    ```zsh
    git add .
    git commit -m "chore: va.b.c"
    ```
