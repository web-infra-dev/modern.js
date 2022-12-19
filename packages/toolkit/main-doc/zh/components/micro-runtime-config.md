```javascript title="App.tsx"
import { defineConfig } from '@edenx/runtime';

defineConfig(App, {
  masterApp: {
    apps: [
        {
            name: "DashBoard",
            entry: "http://127.0.0.1:8081/"
        },
        {
            name: "TableList",
            entry: "http://localhost:8082"
        }
    ]
  }
})
```
