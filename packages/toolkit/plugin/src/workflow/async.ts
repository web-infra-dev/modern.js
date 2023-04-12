import {
  MaybeAsync,
  Middleware,
  createAsyncPipeline,
} from '../farrow-pipeline';

const ASYNC_WORKFLOW_SYMBOL = Symbol.for('MODERN_ASYNC_WORKFLOW');

export type AsyncWorker<I, O> = (I: I) => MaybeAsync<O>;
export type AsyncWorkers<I, O> = AsyncWorker<I, O>[];

export type AsyncWorkflow<I, O> = {
  run: (input: I) => MaybeAsync<O[]>;
  use: (...I: AsyncWorkers<I, O>) => AsyncWorkflow<I, O>;
  [ASYNC_WORKFLOW_SYMBOL]: true;
};

export const isAsyncWorkflow = (input: any): input is AsyncWorkflow<any, any> =>
  Boolean(input?.[ASYNC_WORKFLOW_SYMBOL]);

export const createAsyncWorkflow = <I = void, O = unknown>(): AsyncWorkflow<
  I,
  O
> => {
  const pipeline = createAsyncPipeline<I, O[]>();

  const use: AsyncWorkflow<I, O>['use'] = (...input) => {
    pipeline.use(...input.map(mapAsyncWorkerToAsyncMiddleware));
    return workflow;
  };

  const run: AsyncWorkflow<I, O>['run'] = input => {
    const result = pipeline.run(input, { onLast: () => [] });
    if (isPromise(result)) {
      return result.then(result => result.filter(Boolean));
    }
    return result.filter(Boolean);
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
  (input, next) =>
    Promise.resolve(worker(input)).then(result =>
      Promise.resolve(next(input)).then(nextResult => [result, ...nextResult]),
    );

function isPromise(obj: any): obj is Promise<any> {
  return obj && typeof obj.then === 'function';
}
