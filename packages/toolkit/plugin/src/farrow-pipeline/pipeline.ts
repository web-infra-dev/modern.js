/**
 * modified from https://github.com/farrow-js/farrow/tree/master/packages/farrow-pipeline
 * license at https://github.com/farrow-js/farrow/blob/master/LICENSE
 */
import {
  createContext,
  createContainer,
  ContextStorage,
  Context,
  Container,
  fromContainer,
  runHooks,
  useContainer,
  Hooks,
  runWithContainer,
} from './context';

import { Next, createCounter } from './counter';

export type { Next };

export { createContext, createContainer, useContainer, runWithContainer };

export type { ContextStorage, Context, Container };

export type Middleware<I = unknown, O = unknown> = (
  input: I,
  next: Next<I, O>,
) => O;

export type Middlewares<I = unknown, O = unknown> = Middleware<I, O>[];

export const isPipeline = (input: any): input is Pipeline =>
  Boolean(input?.[PipelineSymbol]);

const PipelineSymbol = Symbol.for('MODERN_PIPELINE');

export type PipelineOptions = {
  contexts?: ContextStorage;
};

export type RunPipelineOptions<I = unknown, O = unknown> = {
  container?: Container;
  onLast?: (input: I) => O;
  onLastWithContext?: boolean;
};

export type MiddlewareInput<I = unknown, O = unknown> =
  | Middleware<I, O>
  | { middleware: Middleware<I, O> };

export type MiddlewareType<T extends MiddlewareInput> =
  T extends MiddlewareInput<infer I, infer O> ? Middleware<I, O> : never;

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

export const createPipeline = <I, O>(options?: PipelineOptions) => {
  const config = {
    ...options,
  };

  const middlewares: Middlewares<I, O> = [];

  const use: Pipeline<I, O>['use'] = (...inputs) => {
    middlewares.push(...inputs.map(getMiddleware));
    return pipeline;
  };

  const createCurrentCounter = (
    hooks: Hooks,
    onLast?: (input: I) => O,
    onLastWithContext?: boolean,
  ) => {
    return createCounter<I, O>((index, input, next) => {
      if (index >= middlewares.length) {
        if (onLast) {
          if (onLastWithContext) {
            return runHooks(() => onLast(input), hooks);
          }
          return onLast(input);
        }
        throw new Error(
          `Expect returning a value, but all middlewares just calling next()`,
        );
      }

      return runHooks(() => middlewares[index](input, next), hooks);
    });
  };

  const currentContainer = createContainer(config.contexts);
  const currentHooks = fromContainer(currentContainer);
  const currentCounter = createCurrentCounter(currentHooks);

  const getCounter = (options?: RunPipelineOptions<I, O>) => {
    if (!options) {
      return currentCounter;
    }

    if (options?.container) {
      const hooks = fromContainer(options?.container);
      return options?.onLast
        ? createCurrentCounter(
            hooks,
            options.onLast,
            typeof options.onLastWithContext === 'boolean'
              ? options.onLastWithContext
              : true,
          )
        : createCurrentCounter(hooks);
    }

    return options?.onLast
      ? createCurrentCounter(
          currentHooks,
          options.onLast,
          typeof options.onLastWithContext === 'boolean'
            ? options.onLastWithContext
            : true,
        )
      : createCurrentCounter(currentHooks);
  };

  const run: Pipeline<I, O>['run'] = (input, options) =>
    getCounter(options).start(input);

  const middleware: Pipeline<I, O>['middleware'] = (input, next) => {
    const container = useContainer();
    return run(input, {
      container,
      onLast: next,
    });
  };

  const pipeline: Pipeline<I, O> = {
    [PipelineSymbol]: true,
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

export type MaybeAsync<T> = T | Promise<T>;

export type ThunkMiddlewareInput<I, O> = () => MaybeAsync<
  MiddlewareInput<I, MaybeAsync<O>>
>;

export type AsyncPipeline<I = unknown, O = unknown> = Pipeline<
  I,
  MaybeAsync<O>
>;

export const createAsyncPipeline = <I, O>(options?: PipelineOptions) => {
  const pipeline = createPipeline<I, MaybeAsync<O>>(options);
  return { ...pipeline } as AsyncPipeline<I, O>;
};
