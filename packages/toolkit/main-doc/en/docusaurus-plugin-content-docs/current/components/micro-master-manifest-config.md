## manifest

```ts
interface Manifest {
  getAppList?: ()=> Array<AppInfo>
}
```

### getAppList?

Through the `getAppList` configuration, you can customize how to get remote list data

```ts
type GetAppList = ()=> Promise<Array<AppInfo>>;
```
