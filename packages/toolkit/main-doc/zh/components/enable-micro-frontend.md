```javascript title="modern.config.ts"
import AppToolPlugin, { defineConfig } from '@modern-js/app-tools';
import GarfishPlugin from '@modern-js/plugin-garfish';

export default defineConfig({
  runtime: {
    router: true,
    state: true,
    masterApp: true,
  },
  plugins: [AppToolPlugin(), GarfishPlugin()],
});
```
