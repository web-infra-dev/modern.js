# @scripts/prebundle

This package is used to prebundle 3rd party dependencies, based on [ncc](https://github.com/vercel/ncc) and `dts-packer`.

## Command

Run following command to prebundle all dependencies:

```
pnpm start
```

## Add a new dependency

1. Remove the dependency from the `dependencies` of original package.
2. Add the dependency to the `devDependencies` of `@scripts/prebundle`. If this package has a `@types/xxx` package, it also needs to be added. It is recommended to lock the version of dependencies.
3. Add the task config to `src/constant.ts`:

```ts
const TASKS: TaskConfig[] = [
  {
    packageDir: 'toolkit/utils',
    packageName: '@modern-js/utils',
    dependencies: [
      // Add the package name
      'address',
    ],
  },
];
```

4. Run `pnpm start`.
5. Import from the compiled directory:

```ts
// Old
import foo from 'foo';

// New
import foo from '../compiled/foo';
```

## Dependency Config

Supported dependency config:

### externals

Externals to leave as requires of the build.

```ts
dependencies: [
  {
    name: 'foo',
    externals: {
      webpack: '../webpack',
    },
  },
];
```

### minify

Whether to minify the code, default `true`.

```ts
dependencies: [
  {
    name: 'foo',
    minify: false,
  },
];
```

### packageJsonField

Copy extra fields from original package.json to target package.json.

```ts
dependencies: [
  {
    name: 'foo',
    packageJsonField: ['options'],
  },
];
```

Following fields will be copied by default:

- `name`
- `author`
- `version`
- `funding`
- `license`
- `types`
- `typing`
- `typings`

### beforeBundle

Callback before bundle.

```ts
dependencies: [
  {
    name: 'foo',
    beforeBundle(task) {
      console.log('do something');
    },
  },
];
```

### emitFiles

Emit extra entry files to map imports.

```ts
dependencies: [
  {
    name: 'foo',
    emitFiles: [
      {
        path: 'foo.js',
        content: `module.exports = require('./').foo;`,
      },
    ],
  },
];
```

### ignoreDts

Ignore the original .d.ts declaration file, then generate a fake .d.ts file.

This can be used to reduce file size for the packages that do not require type definitions, such as webpack plugin.

```ts
dependencies: [
  {
    name: 'foo',
    ignoreDts: true,
  },
];
```
