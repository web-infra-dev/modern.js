---
sidebar_position: 1
---

# Introduction

The file operation API can be used in the `onForged` time to live function, which can add, delete and change the current project file.

File operation API related path to fill in the project relative path, generator plugin will automatically add the current project path prefix.

## File type

The generator plugin divides file types into the following categories:

- Text files: plain text content files, files that can be templated using handlebars.

- Binary files: pictures, audio, video and other files.

:::warning
The jsx or tsx file using the variable is a binary file, and its syntax conflicts with handlebars render, which will cause the template file failed to create.
:::

- JSON files: Files in JSON format, such as `package.json`, `tsconfig.json`.

- Text List File: A file consisting of lines of text, such as `.gitignore`, `.editorconfig`, `.npmrc`.

The file manipulation API for the generator plugin will operate on these four file types.

Its type is defined as:

```ts
export enum FileType {
  Text = 'text',
  Binary = 'binary',
  Json = 'json',
  TextRaw = 'textRaw',
}
```
