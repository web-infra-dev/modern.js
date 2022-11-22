---
title: source.configDir
sidebar_label: configDir
---

* Type: `string`
* Default: `./config`

Modern.js supports placing some files in the `./config` folder to customize HTML templates, icons, static resources, etc. For details, please refer to [File Convention](/docs/apis/app/hooks/config/html).

This option allows you to customize the directory of configuration files.

For example, adjust the resource file directory to the `resources` directory:

```js title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    configDir: './resources',
  },
});
```
