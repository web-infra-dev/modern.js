---
sidebar_position: 7
---

```
Usage: modern inspect [options]

inspect internal webpack config

Options:
  --env <env>           view the configuration in the target environment (default: "development")
  --output <output>     Specify the path to output in the dist (default: "/")
  --no-console          Do not output the full result in shell
  --verbose             Show the full function in the result
  -c --config <config>  configuration file path, which can be a relative path or an absolute path
  -h, --help            show command help
```

`modern inspect` command used to view the full webpack configuration of the project.

Executing the command `npx modern inspect` in the project will output the webpack configuration on the shell, and will also generate a `webpack.client.inspect.js` file in the project's `dist` directory, which developers can open and view manually.

## Configuration Env

By default, the webpack configuration of the development environment is output. And the `env` option can be used to output the configuration of the production environment:

```bash
modern inspect --env production
```

## Configuration Type

### SSR Configuration

If the project has SSR enable, an additional `webpack.ssr.inspect.js` file will be generated in the `dist/`, corresponding to the webpack configuration at SSR build time.

### Modern Configuration

if project enable [enableModernMode](/docs/configure/app/output/enable-modern-mode), an additional `webpack.modern.inspect.js` file will be generated in the `dist/`corresponding to the webpack configuration at modern web build.
