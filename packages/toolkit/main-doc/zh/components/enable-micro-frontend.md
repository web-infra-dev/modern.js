```js title="modern.config.ts"
import appTools, { defineConfig } from '@modern-js/app-tools';
import garfishPlugin from '@modern-js/plugin-garfish';

export default defineConfig({
  runtime: {
    router: true,
    state: true,
    masterApp: true,
  },
  plugins: [appTools(), garfishPlugin()],
});
```
