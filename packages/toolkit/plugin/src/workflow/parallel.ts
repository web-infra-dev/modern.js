import { createAsyncCounter } from '../counter';
import { Hooks, runHooks, fromContainer, createContainer } from '../context';
import { AsyncWorker, AsyncWorkers } from './async';
import type { RunWorkflowOptions } from './sync';

const PARALLEL_WORKFLOW_SYMBOL = Symbol('PARALLEL_WORKFLOW_SYMBOL');

export type ParallelWorkflow<I, O = any> = {
  run: (input: I, options?: RunWorkflowOptions) => Promise<O[]>;
  use: (...I: AsyncWorkers<I, O>) => ParallelWorkflow<I, O>;
  [PARALLEL_WORKFLOW_SYMBOL]: true;
};

export type ParallelWorkflow2Worker<W extends ParallelWorkflow<any>> =
  W extends ParallelWorkflow<infer CS, infer O> ? AsyncWorker<CS, O> : never;

export type ParallelWorkflowRecord = Record<string, ParallelWorkflow<any>>;

export type ParallelWorkflows2Workers<
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  PS extends ParallelWorkflowRecord | void,
> = {
  [K in keyof PS]: PS[K] extends ParallelWorkflow<any>
    ? ParallelWorkflow2Worker<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

export type ParallelWorkflows2AsyncWorkers<
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  PS extends ParallelWorkflowRecord | void,
> = {
  [K in keyof PS]: PS[K] extends ParallelWorkflow<any>
    ? ParallelWorkflow2Worker<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

export type RunnerFromParallelWorkflow<W extends ParallelWorkflow<any>> =
  W extends ParallelWorkflow<infer CS, infer O>
    ? ParallelWorkflow<CS, O>['run']
    : never;

export type ParallelWorkflows2Runners<
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  PS extends ParallelWorkflowRecord | void,
> = {
  [K in keyof PS]: PS[K] extends ParallelWorkflow<any>
    ? RunnerFromParallelWorkflow<PS[K]>
    : // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    PS[K] extends void
    ? // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      void
    : never;
};

export const isParallelWorkflow = (
  input: any,
): input is ParallelWorkflow<any> => Boolean(input?.[PARALLEL_WORKFLOW_SYMBOL]);

export const createParallelWorkflow = <
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  I = void,
  O = unknown,
>(): ParallelWorkflow<I, O> => {
  const middlewares: AsyncWorkers<I, O> = [];

  const createCurrentRunner = (hooks: Hooks) =>
    createAsyncCounter<I, O[]>((index, input, next) => {
      if (index >= middlewares.length) {
        return Promise.resolve<any[]>([]);
      }

      const middleware = middlewares[index];
      return runHooks(
        async () => Promise.all([middleware(input), ...(await next(input))]),
        hooks,
      );
    });

  const currentContainer = createContainer();
  const currentHooks = fromContainer(currentContainer);
  const currentRunner = createCurrentRunner(currentHooks);

  const use: ParallelWorkflow<I, O>['use'] = (...input) => {
    middlewares.push(...input);
    return workflow;
  };

  const run: ParallelWorkflow<I, O>['run'] = async (input, options) => {
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
    [PARALLEL_WORKFLOW_SYMBOL]: true as const,
  };

  return workflow;
};
