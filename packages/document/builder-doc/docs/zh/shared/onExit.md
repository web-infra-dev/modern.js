在进程即将退出时调用，这个钩子只能执行同步代码。

- **类型**

```ts
function OnExit(callback: () => void): void;
```
