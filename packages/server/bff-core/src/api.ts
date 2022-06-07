import 'reflect-metadata';
import compose from 'koa-compose';
import type {
  ApiRunner,
  ArrayToObject,
  ExtractInputType,
  MetadataHelper,
  ExecuteHelper,
  Operator,
  MaybeAsync,
} from './types';
import { validateFunction } from './utils';

export function Api<
  Operators extends Operator<any>[],
  Res extends MaybeAsync<any>,
>(
  ...args: [
    ...operators: Operators,
    handler: (arg: ArrayToObject<ExtractInputType<Operators>>) => Res,
  ]
): ApiRunner<
  ExtractInputType<Operators> extends void[]
    ? void
    : ArrayToObject<ExtractInputType<Operators>>,
  Res
> {
  const handler = args.pop() as (...args: any) => any;
  validateFunction(handler, 'Apihandler');

  const operators = args as Operator<any>[];
  const metadataHelper: MetadataHelper = {
    getMetadata(key: any) {
      return Reflect.getMetadata(key, runner);
    },
    setMetadata(key: any, value: any) {
      return Reflect.defineMetadata(key, value, runner);
    },
  };

  for (const operator of operators) {
    if (operator.metadata) {
      operator.metadata(metadataHelper);
    }
  }

  const validateHandlers = operators
    .filter(operator => operator.validate)
    .map(operator => operator.validate!);

  async function runner(inputs: any) {
    // 错误组合传给用户哪些信息？
    // 取出来所有的 schema，然后做校验
    // 包裹中间件，怎么根据不同框架去包裹?
    // 需要满足的需求，可以关闭某一样 schema 的校验
    // 可以关闭某一个字段的校验
    // 可以设置校验函数以替换 zod ？类型怎么搞?
    // 全局可配置校验函数
    // middleware 多框架实现要支持在路由上配，但这样 middleware 就要在校验之前先执行了

    // 简易模式适配怎么处理?
    // 不同框架适配，响应怎么处理？都传入 co ntext 给这个函数？
    // 如何不依赖 zod 库？支持用户自定义 schema 库？ Query，Data 实现可以统一代码，类型好像无解，除非这些函数是创建出来的，保证只有 http 中依赖 zod 吧

    const executeHelper: ExecuteHelper = {
      result: null,
      get inputs() {
        return inputs;
      },
    };

    const stack = [...validateHandlers];

    stack.push(async (helper: ExecuteHelper, next: any) => {
      const res = await handler(inputs);
      helper.result = res;
      return next();
    });

    await compose(stack)(executeHelper);

    return executeHelper.result;
  }

  return runner as any;
}
