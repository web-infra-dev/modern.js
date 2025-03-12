import type { Operator } from '@modern-js/bff-core';
import { useContext } from '@modern-js/server-core';
import type { Context, Next } from 'hono';

export type EndFunction = ((func: (res: Response) => void) => void) &
  ((data: unknown) => void);

type MaybeAsync<T> = T | Promise<T>;
type PipeFunction<T> = (
  value: T,
  end: EndFunction,
) => MaybeAsync<void> | MaybeAsync<T>;

export const Pipe = <T>(func: PipeFunction<T>): Operator<T> => {
  return {
    name: 'pipe',
    async execute(executeHelper, next) {
      const { inputs } = executeHelper;
      const ctx = useContext();
      const { res } = ctx;
      if (typeof func === 'function') {
        let isPiped = true;
        const end: EndFunction = value => {
          isPiped = false;
          if (typeof value === 'function') {
            value(res);
            return;
          }
          return value;
        };
        const output = await func(inputs, end);
        if (!isPiped) {
          if (output) {
            return (executeHelper.result = output);
          } else {
            return;
          }
        }
        executeHelper.inputs = output as T;
        await next();
      }
    },
  };
};

export type Pipe = typeof Pipe;

export const Middleware = (
  middleware: (c: Context, next: Next) => void,
): Operator<void> => {
  return {
    name: 'middleware',
    metadata(helper) {
      const middlewares = helper.getMetadata('pipe') || [];
      middlewares.push(middleware);
      helper.setMetadata('middleware', middlewares);
    },
  };
};

export type Middleware = typeof Middleware;
