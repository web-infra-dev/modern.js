---
sidebar_position: 7
---

# setInputValue

设置输入默认值。

该方法可直接在 context 上获取。

```ts
export interface IPluginContext {
    setInputValue: (value: Record<string, unknown>) => void;
  ...
}
```

## 示例

```ts
context.setInputValue({
  needModifyModuleConfig: 'no',
  moduleRunWay: 'no',
});
```

:::warning
该方法只支持设置生成器插件集成的工程方案对应的配置参数值，不支持设置工程方案类型(solution)和项目场景(scenes)，这两个配置可以通过执行时的 `--config` 参数设置默认值。
:::
