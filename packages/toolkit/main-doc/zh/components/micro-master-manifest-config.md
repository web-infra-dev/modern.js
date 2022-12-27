## `manifest`

```ts
interface Manifest {
  getAppList?: ()=> Array<AppInfo>
}
```

#### `getAppList?`

通过 `getAppList` 配置，可以自定义如何获取远程列表数据

```ts
type GetAppList = ()=> Promise<Array<AppInfo>>;
```
