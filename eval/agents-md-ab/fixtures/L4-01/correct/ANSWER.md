(1) 在插件的 setup(api) 中调用 api.addCommand。
(2) 回调函数参数拿到的是 commander 库的 program 对象。最小示例：
```ts
api.addCommand(({ program }) => {
  program.command('my-command').action(() => {
    console.log('run my-command');
  });
});
```
