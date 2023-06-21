First, you need to execute `pnpm run new` to enable the SWC compile:

```bash
? Please select the operation you want: Enable features
? Please select the feature name: Enable SWC Compile
```

After the installation, please register the SWC plugin in the `modern.config.ts` file, then the SWC compilation and compression will be enabled.

```ts title="modern.config.ts"
import { appTools, defineConfig } from '@modern-js/app-tools';
import { swcPlugin } from '@modern-js/plugin-swc';

export default defineConfig({
  plugins: [appTools(), swcPlugin()],
});
```
