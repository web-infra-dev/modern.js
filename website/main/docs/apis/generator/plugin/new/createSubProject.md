---
sidebar_position: 4
---

# createSubProject

创建子项目，只支持 Monorepo 工程方案。

该方法可在 onForged 生命周期的 api 参数上获取。

其类型定义为：

```ts
export enum SubSolution {
  MWA = 'mwa',
  MWATest = 'mwa_test',
  Module = 'module',
  InnerModule = 'inner_module',
}
export type ForgedAPI = {
  createSubProject: (
    solution: SubSolution,
    params: Record<string, unknown>,
  ) => Promise<void>;
  ...
};
```

## solution

子项目工程方案名称。

## params

创建子项目的其他参数，详细参考[Monorepo 创建子项目](/docs/apis/generator/config/monorepo#%E5%88%9B%E5%BB%BA%E5%AD%90%E9%A1%B9%E7%9B%AE)。
