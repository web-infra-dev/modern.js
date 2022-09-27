# afterLambdaRegisted

:::info 补充信息
`afterLambdaRegisted` hook 可以在 express 框架模式下，添加代码逻辑，该 hook 中的代码会在 BFF 函数注册路由后执行，可以用于添加中间件，错误处理等。
:::


## API

`export const afterLambdaRegisted = (app: Express) => void`

### 参数
- app: `Express`，Express 实例。

## 示例
```ts title=api/app.ts
const app = express();
// 其他代码...
export default app;

export const afterLambdaRegisted = (app: Express) => {
  const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).send('some error message');
  }
  app.use(errHandler);
}
```
