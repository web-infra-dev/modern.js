---
sidebar_position: 9
---

# rmFile

Delete the file.

This method can be used for any file type.

This method is available on the `onForged` time to live API parameter.

Its type is defined as:

```ts
export type ForgedAPI = {
  rmFile: (fileName: string) => Promise<void>;
  ...
};
```

## fileName

File name or file path to delete.
