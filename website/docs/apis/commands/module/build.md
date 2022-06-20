---
sidebar_position: 2
---

```bash
Usage: modern build [options]

构建模块命令

Options:
  -w, --watch            使用 Watch 模式构建模块
  --tsconfig [tsconfig]  指定 tsconfig.json 文件的路径 (default:
                         "./tsconfig.json")
  --style-only           只构建样式文件
  --platform [platform]  构建其他平台产物
  --no-tsc               关闭 tsc 编译(下个版本废弃)
  --dts                  生成d.ts文件
  --no-clear             不清理产物目录
  -h, --help             display help for command
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />
