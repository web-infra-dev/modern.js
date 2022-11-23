---
sidebar_position: 1
title: Environment Variables
---

Modern.js has built-in support for environment variables, including built-in environment variables and custom environment variables.

## Built-in Environment Variables

### NODE_ENV

A **read-only** environment variable, whose have different values under different execution commands:

- `production`: default value when executing `modern build`、`modern preview` commands.
- `test`: default value when executing `modern test` commands.
- `development`: default value when executing `modern dev` commands, also the default value in all other cases.

### MODERN_ENV

Used to set the current execution environment.In addition to the values corresponding to the above NODE_ENV, custom environment names are supported here, such as `staging`, `boe`.

Modern.js loads the environment variables values set in the `.env.{process.env.MODERN_ENV}` file for that environment variable.

When you need to use different configurations through the environment name, you can define environment variables in the `.env` file of the corresponding environment name.

MODERN_ENV priority is higher than NODE_ENV.

## Custom Environment Variables

Modern.js support custom environment variables, which starting with MODERN_ can be used directly in the code.

If you need to automatically use environment variables with any name, you need to declare them in the ['source.define'](/docs/configure/app/source/define) configuration.

## Define Environment Variables

Environment variables are specified in both `shell` and `.env` files.

### Specify Via Shell

Add custom environment variables before the command:

```shell
REACT_APP_FOO=123 BAR=456 pnpm run dev
```

### Specify Via File

Create a `.env` file in the App root directory with custom environment variables:

```env
REACT_APP_FOO=123
BAR=456
```

`.env` files support suffixes NODE_ENV or MODERN_ENV defined environment names, such as `env.development`. Modern.js reads the env file based on the environment name variable value.

## Using Environment Variables

### Use In JS

Get environment variables directly with `process.env.*`.

```js
console.log(process.env.NODE_ENV);
// "development"
```

### Use In HTML

```html title="config/html/head.ejs"
<meta name="env" content="<%=process.env.NODE_ENV %>" />
```
