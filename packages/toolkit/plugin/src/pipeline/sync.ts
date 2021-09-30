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
  ContextStorage,
  Container,
  fromContainer,
  runHooks,
  useContainer,
  Hooks,
} from '../context';

import { Next, createCounter } from '../counter';

export type Middleware<I = unknown, O = unknown> = (
  input: I,
  next: Next<I, O>,
) => O;

export type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[];

const PIPELINE_SYMBOL = Symbol('PIPELINE_SYMBOL');
export const isPipeline = (input: any): input is Pipeline =>
  Boolean(input?.[PIPELINE_SYMBOL]);

export type PipelineOptions = {
  contexts?: ContextStorage;
};

export type RunPipelineOptions<I = unknown, O = unknown> = {
  container?: Container;
  onLast?: (input: I) => O;
};

export type MiddlewareInput<I = unknown, O = unknown> =
  | Middleware<I, O>
  | { middleware: Middleware<I, O> };

export type MiddlewareType<T extends MiddlewareInput> =
  T extends MiddlewareInput<infer I, infer O> ? Middleware<I, O> : never;

export const getMiddleware = <I, O>(input: MiddlewareInput<I, O>) => {
  if (typeof input === 'function') {
    return input;
  } else if (input && typeof input.middleware === 'function') {
    return input.middleware;
  }
  // eslint-disable-next-line @typescript-eslint/no-base-to-string,@typescript-eslint/restrict-template-expressions
  throw new Error(`${input} is not a Middleware or { middleware: Middleware }`);
};

export type Pipeline<I = unknown, O = unknown> = {
  [PIPELINE_SYMBOL]: true;
  use: (...inputs: MiddlewareInput<I, O>[]) => Pipeline<I, O>;
  run: (input: I, options?: RunPipelineOptions<I, O>) => O;
  middleware: Middleware<I, O>;
};

export const createPipeline = <I, O>(options?: PipelineOptions) => {
  const config = { ...options };

  const middlewares: Middlewares<I, O> = [];

  const use: Pipeline<I, O>['use'] = (...inputs) => {
    middlewares.push(...inputs.map(getMiddleware));
    return pipeline;
  };

  const createCurrentCounter = (hooks: Hooks, onLast?: (input: I) => O) =>
    createCounter<I, O>((index, input, next) => {
      if (index >= middlewares.length) {
        if (onLast) {
          return onLast(input);
        }
        throw new Error(
          `Expect returning a value, but all middlewares just calling next()`,
        );
      }

      const middleware = middlewares[index];
      const result = runHooks(() => middleware(input, next), hooks);

      return result;
    });

  const currentContainer = createContainer(config.contexts);
  const currentHooks = fromContainer(currentContainer);
  const currentCounter = createCurrentCounter(currentHooks);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const run: Pipeline<I, O>['run'] = (input, options) => {
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

  const middleware: Pipeline<I, O>['middleware'] = (input, next) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const container = useContainer();
    return run(input, {
      container,
      onLast: next,
    });
  };

  const pipeline: Pipeline<I, O> = {
    [PIPELINE_SYMBOL]: true,
    use,
    run,
    middleware,
  };

  return pipeline;
};

export type PipelineInput<T extends Pipeline> = T extends Pipeline<infer I>
  ? I
  : never;
export type PipelineOutput<T extends Pipeline> = T extends Pipeline<
  any,
  infer O
>
  ? O
  : never;

export const usePipeline = <I, O>(pipeline: Pipeline<I, O>) => {
  const container = useContainer();

  const runPipeline = (input: I, options?: RunPipelineOptions<I, O>): O =>
    pipeline.run(input, { ...options, container });

  return runPipeline;
};
