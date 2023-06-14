---
sidebar_position: 2
---

# CLI Parameters

The `new` command provides many configuration parameters to configure its behavior during execution, which can be viewed using the `--help` parameter:

```bash
npm run new --help

Usage: modern new [options]

enable optional features or add a new entry

Options:
  --lang <lang>          set new command language(en or zh)
  -c, --config <config>  set default generator config(json string)
  -d, --debug            using debug mode to log something (default: false)
  --dist-tag <tag>       use specified tag version for it's generator
  --registry <registry>  set npm registry url to run npm command
  -h, --help             display help for command
```

The following will provide a detailed introduction to these parameters:

## --lang \<lang>

The language used for execution, supports `zh` and `en`.

By default, the `new` command will automatically recognize the user's system language and choose to use Chinese or English. If recognition fails or does not meet usage habits, this parameter can be used to manually specify it.

## -c, --config \<config>

Specify the default configuration for the project.

By default, the `new` command will prompt interactive questions during the execution process for selecting operation types, enabling features, etc. When it is necessary to specify these configuration contents in advance, they can be passed in through this field.

This field is a JSON string. For example, to specify the BFF framework:

```bash
npm run new --config '{"framework": "express"}'
```

The parameters supported by `config` can be viewed in [Configuration Parameters](/guides/topic-detail/generator/new/config.html)。

## -d,--debug

Displays debug logs.

When encountering problems during use, this parameter can be used to display debug logs, which is convenient for quickly locating the problem location and troubleshooting the problem.

## --registry \<registry>

Specify the sub-generator to execute and the npm registry to fetch project dependencies version.

## --dist-tag \<distTag>

Specify the generator version.

During the execution process of the `new` command, smaller micro-generator will be executed by default, and the latest micro-generator version will be used by default. This parameter can be used to specify the version number of the micro-generator to be executed.

For example, using the `next` version:

```bash
npm run new --dist-tag next
```
