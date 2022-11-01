---
sidebar_position: 8
---

# updateModernConfig

更新 `package.json` 中 `modernConfig` 字段。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export type ForgedAPI = {
  updateModernConfig: (updateInfo: Record<string, any>) => Promise<void>;
  ...
};
```

## updateInfo

字段更新信息。

:::info
该函数为 updateJSONFile 的封装，将自动更新 `package.json` 的 `modernConfig` 字段 updateInfo 中只需填写相对于 `modernConfig` 的更新信息即可。
:::
