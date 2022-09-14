---
sidebar_position: 6
---

# updateJSONFile

更新 JSON 文件字段。

该方法适用于 JSON 文件类型，可批量更新 JSON 文件中字段值。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

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

JSON 文件的文件名或者文件路径。

## updateInfo

字段更新信息。
该信息使用 Record 形式表示。

例如需要更新 name 字段：

```ts
api.updateJSONFile(file, {
    name: "新名称"
})
```

需更新嵌套字段：

```ts
api.updateJSONFile(file, {
  "dependencies.name": "新名称"
})
```

:::warning
更新嵌套字段时注意字段名，如果不是全量更新，需将嵌套的 key 也写入字段名中。
:::
