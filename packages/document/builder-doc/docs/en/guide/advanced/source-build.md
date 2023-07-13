# Source-code Build Mode

The source-code build mode allows developers to use dependent subproject source code in Monorepo. This allows HMR (Hot Module Replacement) to be performed without starting a subproject build task.

## Enable source-code build

In Builder, you can enable this feature by setting [`experiments.sourceBuild`](/api/config-experiments.html#experimentssourcebuild) to `true`.

```ts
export default {
    experiments: {
        sourceBuild: true,
    },
};
```

## Specify the sub-projects that need to read the source code

When you need to read the source code of a subproject, you need to make sure that the package.json of the subproject contains a `source` field, and that the path to the file corresponding to that field is the path to the source code file.


```json title="package.json"
{
    "name": "lib",
    "main": "./dist/index.js",
    "source": "./src/index.ts"
}
```

If the [`exports`](https://nodejs.org/api/packages.html#package-entry-points) configuration exists for the subproject, then you need to add the `source` field to exports at the same time.

```json title="package.json"
{
    "name": "lib",
    "main": "./dist/index.js",
    "source": "./src/index.ts",
    "exports": {
        ".": {
            "source": "./src/index.ts",
            "default": "./dist/index.js"
        },
        "./features": {
            "source": "./src/features/index.ts",
            "default": "./dist/features/index.js"
        }
    }
}
```

## Caveat

There are a few things to keep in mind when using the source-code build mode:

1. Ensure that all configurations or features used by sub-projects need to be set in the Builder's configuration file.
2. Ensure that the current project uses the same code syntax as the subprojects, such as the syntax of the decorators.
3. There may be some limitations in the source build. When you encounter problems, you can remove the `source` field in the package.json of the subproject and use the build product of the subproject for debugging.
