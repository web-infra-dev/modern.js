import { Operator } from '@modern-js/bff-core';
import { NextFunction } from '@modern-js/types';
import type { Request, Response } from 'express';
import { useContext } from '../context';

export type EndFunction = ((func: (res: Response) => void) => void) &
  ((data: unknown) => void);

type MaybeAsync<T> = T | Promise<T>;
type PipeFunction<T> = (
  value: T,
  end: EndFunction,
) => MaybeAsync<void> | MaybeAsync<T>;

export const Pipe = <T>(func: PipeFunction<T>): Operator => {
  return {
    name: 'pipe',
    // eslint-disable-next-line consistent-return
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
          // eslint-disable-next-line consistent-return
          return value;
        };
        const output = await func(inputs, end);
        if (!isPiped) {
          if (output) {
            return (executeHelper.result = output);
          } else {
            // eslint-disable-next-line consistent-return
            return;
          }
        }
        executeHelper.inputs = output;
        await next();
      }
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Pipe = typeof Pipe;

export const Middleware = (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
): Operator => {
  return {
    name: 'middleware',
    metadata(helper) {
      const middlewares = helper.getMetadata('pipe') || [];
      middlewares.push(middleware);
      helper.setMetadata('middleware', middlewares);
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Middleware = typeof Middleware;
