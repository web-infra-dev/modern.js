/**
 * Copyright Lucifier129 and other contributors.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file at
 * https://github.com/farrow-js/farrow/blob/master/LICENSE
 *
 */

import {
  createContainer,
  Container,
  fromContainer,
  runHooks,
  useContainer,
  Hooks,
} from '../context';

import { AsyncNext, createAsyncCounter } from '../counter';

import type { PipelineOptions } from './sync';

export type AsyncMiddleware<I = unknown, O = unknown> = (
  input: I,
  next: AsyncNext<I, O>,
) => O | Promise<O>;

export type AsyncMiddlewares<I = unknown, O = unknown> = AsyncMiddleware<
  I,
  O
>[];

const ASYNC_PIPELINE_SYMBOL = Symbol('ASYNC_PIPELINE_SYMBOL');
export const isAsyncPipeline = (input: any): input is AsyncPipeline =>
  Boolean(input?.[ASYNC_PIPELINE_SYMBOL]);

export type RunAsyncPipelineOptions<I = unknown, O = unknown> = {
  container?: Container;
  onLast?: (input: I) => O | Promise<O>;
};

export type AsyncMiddlewareInput<I = unknown, O = unknown> =
  | AsyncMiddleware<I, O>
  | { middleware: AsyncMiddleware<I, O> };

export type AsyncMiddlewareType<T extends AsyncMiddlewareInput> =
  T extends AsyncMiddlewareInput<infer I, infer O>
    ? AsyncMiddleware<I, O>
    : never;

export const getAsyncMiddleware = <I, O>(input: AsyncMiddlewareInput<I, O>) => {
  if (typeof input === 'function') {
    return input;
  } else if (input && typeof input.middleware === 'function') {
    return input.middleware;
  }
  // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
  throw new Error(`${input} is not a Middleware or { middleware: Middleware }`);
};

export type AsyncPipeline<I = unknown, O = unknown> = {
  [ASYNC_PIPELINE_SYMBOL]: true;
  use: (...inputs: AsyncMiddlewareInput<I, O>[]) => AsyncPipeline<I, O>;
  run: (input: I, options?: RunAsyncPipelineOptions<I, O>) => Promise<O>;
  middleware: AsyncMiddleware<I, O>;
};

export const createAsyncPipeline = <I, O>(options?: PipelineOptions) => {
  const config = { ...options };

  const middlewares: AsyncMiddlewares<I, O> = [];

  const use: AsyncPipeline<I, O>['use'] = (...inputs) => {
    middlewares.push(...inputs.map(getAsyncMiddleware));
    return pipeline;
  };

  const createCurrentCounter = (
    hooks: Hooks,
    onLast?: (input: I) => O | Promise<O>,
  ) =>
    createAsyncCounter<I, O>(async (index, input, next) => {
      if (index >= middlewares.length) {
        if (onLast) {
          return onLast(input);
        }
        throw new Error(
          `Expect returning a value, but all middlewares just calling next()`,
        );
      }

      const middleware = middlewares[index];
      const result = await runHooks(async () => middleware(input, next), hooks);

      return result;
    });

  const currentContainer = createContainer(config.contexts);
  const currentHooks = fromContainer(currentContainer);
  const currentCounter = createCurrentCounter(currentHooks);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const run: AsyncPipeline<I, O>['run'] = (input, options) => {
    const container = options?.container ?? currentContainer;
    const hooks =
      container === currentContainer ? currentHooks : fromContainer(container);
    let counter =
      container === currentContainer
        ? currentCounter
        : createCurrentCounter(hooks);

    if (options?.onLast) {
      counter = createCurrentCounter(hooks, options.onLast);
    }

    const result = counter.start(input);

    return result;
  };

  const middleware: AsyncPipeline<I, O>['middleware'] = (input, next) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const container = useContainer();
    return run(input, {
      container,
      onLast: next,
    });
  };

  const pipeline: AsyncPipeline<I, O> = {
    [ASYNC_PIPELINE_SYMBOL]: true,
    use,
    run,
    middleware,
  };

  return pipeline;
};

export type AsyncPipelineInput<T extends AsyncPipeline> =
  T extends AsyncPipeline<infer I> ? I : never;

export type AsyncPipelineOutput<T extends AsyncPipeline> =
  T extends AsyncPipeline<any, infer O> ? O : never;

export const useAsyncPipeline = <I, O>(pipeline: AsyncPipeline<I, O>) => {
  const container = useContainer();

  const runPipeline = (
    input: I,
    options?: RunAsyncPipelineOptions<I, O>,
  ): Promise<O> => pipeline.run(input, { ...options, container });

  return runPipeline;
};
