---
sidebar_position: 7
---

# updateTextRawFile

Update the text list file content.

This method works with the text list file type.

This method is available on the `onForged` time to live API parameter.

Its type is defined as:

```ts
export type ForgedAPI = {
updateTextRawFile: (
    fileName: string,
    update: (content: string[]) => string[],
  ) => Promise<void>;
  ...
};
```

## fileName

The filename or file path of the text list file.

## update

Update function.

The function parameter is the current file content. The content will be divided by `\n` and passed into function in the form of array. The return value of function is also array. The internal will be automatically merged with `\n` and written to the source file.
