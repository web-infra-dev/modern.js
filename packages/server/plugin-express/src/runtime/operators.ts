import { Operator } from '@modern-js/bff-core';
import { NextFunction } from '@modern-js/types';
import type { Request, Response } from 'express';

export type EndFunction = ((func: (res: Response) => void) => void) &
  ((data: unknown) => void);

type PipeFunction<T> = (value: T, end: EndFunction) => void;
export const Pipe = <T>(func: PipeFunction<T>): Operator<void> => {
  return {
    name: 'pipe',
    metadata(helper) {
      const pipeFuncs = helper.getMetadata<PipeFunction<T>[]>('pipe') || [];
      pipeFuncs.push(func);
      helper.setMetadata('pipe', pipeFuncs);
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Pipe = typeof Pipe;

export const Middleware = (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
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

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type Middleware = typeof Middleware;
