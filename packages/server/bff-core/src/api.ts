import 'reflect-metadata';
import compose from 'koa-compose';
import type {
  ApiRunner,
  ArrayToObject,
  ExecuteHelper,
  ExtractInputType,
  ExtractOuputType,
  MaybeAsync,
  MetadataHelper,
  Operator,
} from './types';
import { HANDLER_WITH_META, validateFunction } from './utils';

interface Runner {
  (inputs: any): Promise<any>;
  [HANDLER_WITH_META]: boolean;
}

type NextFunction = () => void;

export function Api<
  Operators extends Operator<any, any>[],
  Res extends MaybeAsync<any>,
>(
  ...args: [
    ...operators: Operators,
    handler: (arg: ArrayToObject<ExtractOuputType<Operators>>) => Res,
  ]
): ApiRunner<
  ExtractInputType<Operators> extends void[]
    ? void
    : ArrayToObject<ExtractInputType<Operators>>,
  Res
> {
  const handler = args.pop() as (...args: any) => any;
  validateFunction(handler, 'Apihandler');

  const operators = args as Operator<any, any>[];
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

  const pipeHandlers = operators
    .filter(operator => operator.execute)
    .map(operator => operator.execute!);

  async function runner<T>(inputs: T) {
    const executeHelper: ExecuteHelper<T> = {
      result: null,
      get inputs() {
        return inputs;
      },
      set inputs(val) {
        // biome-ignore lint/style/noParameterAssign: <explanation>
        inputs = val;
      },
    };

    const stack = [...validateHandlers, ...pipeHandlers];

    stack.push(async (helper: ExecuteHelper<T>, next: NextFunction) => {
      const res = await handler(helper.inputs);
      helper.result = res;
      return next();
    });

    await compose(stack)(executeHelper);

    return executeHelper.result;
  }

  (runner as Runner)[HANDLER_WITH_META] = true;

  return runner as any;
}
