import { createAsyncCounter } from '../counter';
import { Hooks, runHooks, fromContainer, createContainer } from '../context';
import type { RunWorkflowOptions } from './sync';

const ASYNC_WORKFLOW_SYMBOL = Symbol('ASYNC_WORKFLOW_SYMBOL');

export type AsyncWorker<I, O> = (I: I) => O | Promise<O>;
export type AsyncWorkers<I, O> = AsyncWorker<I, O>[];

export type AsyncWorkflow<I, O> = {
  run: (input: I, options?: RunWorkflowOptions) => Promise<O[]>;
  use: (...I: AsyncWorkers<I, O>) => AsyncWorkflow<I, O>;
  [ASYNC_WORKFLOW_SYMBOL]: true;
};

export type AsyncWorkflow2AsyncWorker<W extends AsyncWorkflow<any, any>> =
  W extends AsyncWorkflow<infer I, infer O> ? AsyncWorker<I, O> : never;

export type AsyncWorkflowRecord = Record<string, AsyncWorkflow<any, any>>;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncWorkflows2AsyncWorkers<PS extends AsyncWorkflowRecord | void> =
  {
    [K in keyof PS]: PS[K] extends AsyncWorkflow<any, any>
      ? AsyncWorkflow2AsyncWorker<PS[K]>
      : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      PS[K] extends void
      ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
        void
      : never;
  };

export type RunnerFromAsyncWorkflow<W extends AsyncWorkflow<any, any>> =
  W extends AsyncWorkflow<infer I, infer O>
    ? AsyncWorkflow<I, O>['run']
    : never;

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type AsyncWorkflows2Runners<PS extends AsyncWorkflowRecord | void> = {
  [K in keyof PS]: PS[K] extends AsyncWorkflow<any, any>
    ? RunnerFromAsyncWorkflow<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

export const isAsyncWorkflow = (input: any): input is AsyncWorkflow<any, any> =>
  Boolean(input?.[ASYNC_WORKFLOW_SYMBOL]);

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export const createAsyncWorkflow = <I = void, O = unknown>(): AsyncWorkflow<
  I,
  O
> => {
  const middlewares: AsyncWorkers<I, O> = [];

  const createCurrentRunner = (hooks: Hooks) =>
    createAsyncCounter<I, O[]>(async (index, input, next) => {
      if (index >= middlewares.length) {
        return [];
      }

      const middleware = middlewares[index];
      return runHooks(async () => {
        const result = await middleware(input);
        const rest = await next(input);
        return [result, ...rest];
      }, hooks);
    });
  const currentContainer = createContainer();
  const currentHooks = fromContainer(currentContainer);
  const currentRunner = createCurrentRunner(currentHooks);

  const use: AsyncWorkflow<I, O>['use'] = (...input) => {
    middlewares.push(...input);
    return workflow;
  };

  const run: AsyncWorkflow<I, O>['run'] = async (input, options) => {
    const container = options?.container ?? currentContainer;
    const hooks =
      container === currentContainer ? currentHooks : fromContainer(container);
    const runner =
      container === currentContainer
        ? currentRunner
        : createCurrentRunner(hooks);

    return runner.start(input);
  };

  const workflow = {
    use,
    run,
    [ASYNC_WORKFLOW_SYMBOL]: true as const,
  };

  return workflow;
};
