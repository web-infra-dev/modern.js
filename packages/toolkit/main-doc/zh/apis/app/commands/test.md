---
sidebar_position: 3
---

```bash
Usage: modern test [options]

Options:
  -h, --help  显示命令帮助
```

:::caution 注意
`modern test` 命令需要先通过 [`new`](/docs/apis/app/commands/new) 命令启用「单元测试 / 集成测试」功能
:::

`modern test` 命令会自动运行项目下的测试用例，效果如下：

```bash
$ npx modern test
 PASS  src/tests/index.test.ts
  The add method
    ✓ should work fine. (2ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.994 s, estimated 1 s
```

:::info 注
`src` 和 `api` 目录下面 `*.test.(js|ts)` 都会默认识别为测试用例。
:::
