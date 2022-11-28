---
sidebar_position: 1
---

# Introduction

Modern.js supports the customization of the provided engineering solutions by means of generator plugins or the customization of specific scenarios for engineering solutions.

## Generator plugin composition

The generator plugin is a module that can be developed directly using Modern.js module engineering solutions. Of course, Modern.js also provides the corresponding generator plugin (`@modern-js/generator-plugin-plugin`) to directly create a new generator plugin project.


A generator plugin project directory is as follows:

```bash
.
├── README.md
├── package.json
├── src
│   ├── index.ts
│   └── modern-app-env.d.ts
├── templates
└── tsconfig.json
```

The `src/index.ts` is the source code directory, which is used to develop the generator plugin logic. The plugin exports a function by default, and the function parameter is `context`. Some methods are provided on the `context` to directly operate the current project. These methods will be introduced in detail later in this chapter.

The `templates` directory is the template directory used to store template files that need to be used in the generator plugin.

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

`key` is the scene scheme name and the value is a character string.
`name` is the display name of the scene scheme, used for the display of the option when used, and the value is a character string.
`type` is the project solution type. In addition to supporting three project solutions like `extend`, it also supports the customize (custom) type.

### Custom type

The customize type provides the implementation capability of the full custom project solution. When using this type to create a new project solution scenario, only a small amount of code for best practices at the development level is provided, such as `.gitignore`, `.editorConfig` and other files, specifically for the following directory structure:

```
.
├── .editorconfig
├── .gitignore
├── .idea
│   ├── codeStyles
│   │   ├── Project.xml
│   │   └── codeStyleConfig.xml
│   ├── inspectionProfiles
│   │   └── Project_Default.xml
│   └── jsLinters
│       └── eslint.xml
├── .nvmrc
└── .vscode
    ├── extensions.json
    └── settings.json
```

Customized types ensure flexible configuration according to their needs for engineering solutions.
