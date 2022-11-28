---
sidebar_position: 5
---

# addManyFile

Import in batches file. Multiple files for adding the `templates` directory.

This method can be used with any file type, for file types other than binary, Handlebars render is performed when files are added.

This method is available on the `onForged` time to live API parameter.

Its type is defined as:

```ts
export interface AddManyFilesParams {
  type: FileType;
  destination: string;
  templateFiles: string[] | (() => string[]);
  templateBase?: string;
  fileNameFunc?: (name: string) => string;
  data?: Record<string, string>; // template data
}
export type ForgedAPI = {
  addManyFiles: (params: AddManyFilesParams) => Promise<void>;
  ...
};
```

## type

File type, specific viewable[File type](/docs/guides/topic-detail/generator/plugin/api/file/introduce).

## destination

Create the target folder path. Since it is an import in batches file, fill in the folder path that needs to be written here.

## templateFiles

List of template files.

This parameter supports the function parameter, as well as [globby](https://www.npmjs.com/package/globby).

## templateBase

Template base path.

The template path is usually the template file in the same directory. If the render result needs to remove the template file prefix directory, this field can be used.

Template render file content will be equal to `templateFiles - templateBase`

## fileNameFunc

Rename file function, where the file name of render is passed in once, and can be renamed in this function.

## data

Handlebars renders data.
