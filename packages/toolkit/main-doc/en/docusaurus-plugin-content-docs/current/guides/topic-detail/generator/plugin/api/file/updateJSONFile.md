---
sidebar_position: 6
---

# updateJSONFile

Update the JSON file fields.

This method is suitable for JSON file types, and can batch update field values in JSON files.

This method is available on the `onForged` time to live API parameter.

Its type is defined as:

```ts
export type ForgedAPI = {
  updateJSONFile: (
    fileName: string,
    updateInfo: Record<string, unknown>,
  ) => Promise<void>;
  ...
};
```

## fileName

The filename or file path of the JSON file.

## updateInfo

Field update information.

This information is represented in Record form.

For example, the name field needs to be updated:


```ts
api.updateJSONFile(file, {
    name: "new name"
})
```

需更新嵌套字段：

```ts
api.updateJSONFile(file, {
  "dependencies.name": "new name"
})
```

:::warning
Pay attention to the field name when updating the nested field. If it is not a total volume update, the nested key should also be written into the field name.
:::
