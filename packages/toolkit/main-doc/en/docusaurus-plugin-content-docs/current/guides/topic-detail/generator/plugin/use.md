---
sidebar_position: 2
---

# How to use the generator plugin

`@modern-js/create` provides the `--plugin` parameter to declare the generator plugin used.

You can use the generator plugin directly by executing the following command:

```bash
npx @modern-js/create --plugin <pluginName>
```

The plugin parameter supports multiple declarations, which means that multiple generator plugins are used at the same time.

## Classification

There are two types of generator plugins:

1. Extended engineering: directly customize the three major engineering provided by default.

2. Create engineering scenes: Create corresponding engineering scenes based on the default three major engineering schemes.

### Type definition

The classification of the generator plugin is provided by the meta information in the `package.json`.

#### Extended engineering

```json
{
    "meta": {
        "extend": "mwa" // The three engineering is mwa, module, monorepo
    }
}
```

#### Create engineering scenes

```json
{
    "meta": {
        "key": "new_solution",
        "name": "New Solution",
        "type": "mwa" // In addition to the three major engineering solutions, the type here also supports the customize (custom) type
    }
}
```

### Execution timing

The execution timing of different types of custom engineering solutions is different.

#### Extended engineering

The generator plugin of the extended engineering type will execute in sequence according to the declaration order of the plugin parameter after selecting the corresponding extended project scheme.

#### Create engineering scenes

The generator plugin that create engineering scenes will have the option to select the scene after selecting the project solution type. The option list includes the current default project scenes and the project scenes defined by the plugin. If you select the corresponding scene, the corresponding generator will be executed plugin.
