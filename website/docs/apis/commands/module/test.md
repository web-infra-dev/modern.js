---
sidebar_position: 3
---

```bash
Usage: modern test [options]

Options:
  -h, --help  display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

`modern test` 命令会自动将 `src/tests/*.test.(js|ts|jsx|tsx)` 文件当做测试用例运行：

```bash
$ npx modern test
PASS  tests/index.test.tsx
默认值 cases
  ✓ Rendered (26 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        2.278 s
Ran all test suites.
```

