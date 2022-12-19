---
sidebar_position: 7
---

```
Usage: modern inspect [options]

Options:
  --env <env>           view the configuration in the target environment (default: "development")
  --output <output>     Specify the path to output in the dist (default: "/")
  --verbose             Show the full function in the result
  -c --config <config>  configuration file path, which can be a relative path or an absolute path
  -h, --help            show command help
```

`modern inspect` command used to view the [Modern.js Builder config](https://modernjs.dev/builder/en/guide/basic/builder-config.html) and webpack config of the project.

After executing the command `npx modern inspect` in the project root directory, the following files will be generated in the `dist` directory of the project:

- `builder.config.js`: The Modern.js Builder config to use at build time.
- `webpack.config.web.js`: The webpack config used by to use at build time.

## Configuration Env

By default, the inspect command will output the development configs, you can use the `env` option to output the production configs:

```bash
modern inspect --env production
```

## Verbose content

By default, the inspect command will omit the function content in the config object, you can use the `env` option to output the full content of the function:

```bash
modern inspect --verbose
```

### SSR Configuration

If the project has enabled SSR, an additional `webpack.config.node.js` file will be generated in the `dist/`, corresponding to the webpack configuration at SSR build time.
