import { MaybeAsync, createAsyncPipeline, Middleware } from 'farrow-pipeline';
import type { RunWorkflowOptions } from './sync';

const ASYNC_WORKFLOW_SYMBOL = Symbol('ASYNC_WORKFLOW_SYMBOL');

export type AsyncWorker<I, O> = (I: I) => MaybeAsync<O>;
export type AsyncWorkers<I, O> = AsyncWorker<I, O>[];

export type AsyncWorkflow<I, O> = {
  run: (input: I, options?: RunWorkflowOptions) => MaybeAsync<O[]>;
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
  const pipeline = createAsyncPipeline<I, O[]>();

  const use: AsyncWorkflow<I, O>['use'] = (...input) => {
    pipeline.use(...input.map(mapAsyncWorkerToAsyncMiddleware));
    return workflow;
  };

  const run: AsyncWorkflow<I, O>['run'] = async (input, options) => {
    const result = pipeline.run(input, { ...options, onLast: () => [] });
    if (isPromise(result)) {
      // eslint-disable-next-line @typescript-eslint/no-shadow,promise/prefer-await-to-then
      return result.then(result => result.filter(Boolean));
    } else {
      return result.filter(Boolean);
    }
  };

  const workflow: AsyncWorkflow<I, O> = {
    ...pipeline,
    use,
    run,
    [ASYNC_WORKFLOW_SYMBOL]: true as const,
  };

  return workflow;
};

const mapAsyncWorkerToAsyncMiddleware =
  <I, O>(worker: AsyncWorker<I, O>): Middleware<I, MaybeAsync<O[]>> =>
  async (input, next) =>
    [await worker(input), ...(await next(input))];

function isPromise(obj: any): obj is Promise<any> {
  /* eslint-disable promise/prefer-await-to-then */
  return (
    Boolean(obj) &&
    (typeof obj === 'object' || typeof obj === 'function') &&
    typeof obj.then === 'function'
  );
  /* eslint-enable promise/prefer-await-to-then */
}
