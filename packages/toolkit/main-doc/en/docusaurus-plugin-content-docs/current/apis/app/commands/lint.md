---
sidebar_position: 4
title: lint
---

```bash
Usage: modern lint [options] [...files]

lint and fix source files

Options:
  --no-fix    disable auto fix source file
  -h, --help  display help for command
```

Run ESLint to check the syntax of the code. Normally, only the part of the code modified by this commit needs to be checked by `lint-staged` during the `git commit` phase.

* `--no-fix` close auto fix by lint.

import CommandTip from '@site-docs-en/components/command-tip.md'

<CommandTip />
