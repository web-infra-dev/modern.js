/**
 * modified from https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline
 * license at https://github.com/farrow-js/farrow/blob/master/LICENSE
 */
import { createContext, Context } from './context';

import { Next, createCounter } from './counter';

export type { Next };

export { createContext };

export type { Context };

export type Middleware<I = unknown, O = unknown> = (
  input: I,
  next: Next<I, O>,
) => O;

export type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[];

export const isPipeline = (input: any): input is Pipeline =>
  Boolean(input?.[PipelineSymbol]);

const PipelineSymbol = Symbol.for('MODERN_PIPELINE');

export type RunPipelineOptions<I = unknown, O = unknown> = {
  onLast?: (input: I) => O;
};

export type MiddlewareInput<I = unknown, O = unknown> =
  | Middleware<I, O>
  | { middleware: Middleware<I, O> };

const getMiddleware = <I, O>(input: MiddlewareInput<I, O>) => {
  if (typeof input === 'function') {
    return input;
  } else if (input && typeof input.middleware === 'function') {
    return input.middleware;
  }
  throw new Error(`${input} is not a Middleware`);
};

export type Pipeline<I = unknown, O = unknown> = {
  [PipelineSymbol]: true;
  use: (...inputs: MiddlewareInput<I, O>[]) => Pipeline<I, O>;
  run: (input: I, options?: RunPipelineOptions<I, O>) => O;
  middleware: Middleware<I, O>;
};

export const createPipeline = <I, O>() => {
  const middlewares: Middlewares<I, O> = [];

  const use: Pipeline<I, O>['use'] = (...inputs) => {
    middlewares.push(...inputs.map(getMiddleware));
    return pipeline;
  };

  const createCurrentCounter = (onLast?: (input: I) => O) => {
    return createCounter<I, O>((index, input, next) => {
      if (index >= middlewares.length) {
        if (onLast) {
          return onLast(input);
        }
        throw new Error(
          `Expect returning a value, but all middlewares just calling next()`,
        );
      }

      return middlewares[index](input, next);
    });
  };

  const currentCounter = createCurrentCounter();

  const getCounter = (options?: RunPipelineOptions<I, O>) => {
    if (!options) {
      return currentCounter;
    }
    return createCurrentCounter(options?.onLast);
  };

  const run: Pipeline<I, O>['run'] = (input, options) =>
    getCounter(options).start(input);

  const middleware: Pipeline<I, O>['middleware'] = (input, next) =>
    run(input, {
      onLast: next,
    });

  const pipeline: Pipeline<I, O> = {
    [PipelineSymbol]: true,
    use,
    run,
    middleware,
  };

  return pipeline;
};

export type MaybeAsync<T> = T | Promise<T>;

export type AsyncPipeline<I = unknown, O = unknown> = Pipeline<
  I,
  MaybeAsync<O>
>;

export const createAsyncPipeline = <I, O>() => {
  const pipeline = createPipeline<I, MaybeAsync<O>>();
  return { ...pipeline } as AsyncPipeline<I, O>;
};
